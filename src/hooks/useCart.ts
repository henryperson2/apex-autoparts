import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCartSessionToken, type CartLine } from "@/lib/store";

async function ensureCartId(): Promise<string> {
  const token = getCartSessionToken();
  const { data: existing, error: selectError } = await supabase
    .from("carts")
    .select("id")
    .eq("session_token", token)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from("carts")
    .insert({ session_token: token })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return created.id;
}

async function fetchCartLines(): Promise<CartLine[]> {
  const token = getCartSessionToken();
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("session_token", token)
    .maybeSingle();
  if (!cart) return [];

  const { data, error } = await supabase
    .from("cart_items")
    .select("id, quantity, product:products(*, categories(name, slug))")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.product)
    .map((row) => ({
      id: row.id,
      quantity: row.quantity,
      product: row.product,
    })) as unknown as CartLine[];
}

export function useCart() {
  const queryClient = useQueryClient();

  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCartLines,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const addItem = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const cartId = await ensureCartId();
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from("cart_items")
        .insert({ cart_id: cartId, product_id: productId, quantity });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity < 1) {
        const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      const token = getCartSessionToken();
      const { data: cartRow } = await supabase
        .from("carts")
        .select("id")
        .eq("session_token", token)
        .maybeSingle();
      if (!cartRow) return;
      const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartRow.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const lines = cart.data ?? [];
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return { lines, itemCount, isLoading: cart.isLoading, addItem, updateQuantity, removeItem, clearCart };
}
