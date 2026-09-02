import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, unitPrice, type Product } from "@/lib/store";

export const Route = createFileRoute("/products/$slug")({
  head: () => ({
    meta: [
      { title: "Part Details | Apex Auto Parts" },
      {
        name: "description",
        content:
          "Specs, fitment notes, warranty and stock status for this Apex Auto Parts component. Offline payment on every order.",
      },
      { property: "og:title", content: "Part Details | Apex Auto Parts" },
      {
        property: "og:description",
        content: "Full specs, fitment and warranty details for this auto part.",
      },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const product = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Product) ?? null;
    },
  });

  const related = useQuery({
    queryKey: ["related", product.data?.category_id, slug],
    enabled: Boolean(product.data?.category_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("category_id", product.data!.category_id!)
        .neq("slug", slug)
        .limit(4);
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  if (product.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="h-96 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  const item = product.data;
  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-4xl">Part not found</h1>
        <p className="mt-3 text-muted-foreground">
          That SKU may be discontinued. Browse the catalog for a current equivalent.
        </p>
        <Button asChild variant="brass" className="mt-6">
          <Link to="/products">Back to catalog</Link>
        </Button>
      </div>
    );
  }

  const price = unitPrice(item);
  const onSale = item.sale_price != null && Number(item.sale_price) < Number(item.price);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="label-stencil">
        <Link to="/products">
          <ArrowLeft /> Catalog
        </Link>
      </Button>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-4/3 overflow-hidden rounded-md surface-steel">
            {shownImage ? (
              <img
                src={shownImage}
                alt={item.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center font-display text-7xl text-brass/25">
                {item.brand ?? "APEX"}
              </span>
            )}
            <span className="absolute left-0 top-0 h-1.5 w-full diagonal-hazard opacity-50" />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {gallery.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(url)}
                  aria-label="View product image"
                  className={`overflow-hidden rounded border ${
                    shownImage === url ? "border-brass" : "border-border hover:border-brass/60"
                  }`}
                >
                  <img src={url} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>


        <div>
          <p className="label-stencil text-sm text-brass">
            {item.categories?.name} · SKU {item.sku}
          </p>
          <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{item.name}</h1>

          <div className="mt-5 flex items-end gap-3">
            <span className="font-display text-4xl">{formatCurrency(price)}</span>
            {onSale && (
              <span className="pb-1 text-lg text-muted-foreground line-through">
                {formatCurrency(Number(item.price))}
              </span>
            )}
          </div>

          <p className="mt-5 text-muted-foreground">{item.description}</p>

          <dl className="mt-6 grid gap-3 border-y border-border py-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="label-stencil text-xs text-muted-foreground">Brand</dt>
              <dd className="mt-0.5">{item.brand ?? "Apex"}</dd>
            </div>
            <div>
              <dt className="label-stencil text-xs text-muted-foreground">Warranty</dt>
              <dd className="mt-0.5">{item.warranty ?? "12 months"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="label-stencil text-xs text-muted-foreground">Fitment</dt>
              <dd className="mt-0.5">{item.fitment ?? "Universal"}</dd>
            </div>
            <div>
              <dt className="label-stencil text-xs text-muted-foreground">Availability</dt>
              <dd className="mt-0.5">
                {item.stock > 0 ? `${item.stock} in stock` : "Backorder — 5-7 days"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-md border border-border">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus />
              </Button>
              <span className="w-10 text-center font-display text-xl">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Increase quantity"
                onClick={() => setQuantity((value) => value + 1)}
              >
                <Plus />
              </Button>
            </div>
            <Button
              variant="brass"
              size="lg"
              disabled={addItem.isPending}
              onClick={() =>
                addItem.mutate(
                  { productId: item.id, quantity },
                  {
                    onSuccess: () => toast.success(`${quantity} × ${item.name} added to cart`),
                    onError: () => toast.error("Could not add that part. Try again."),
                  },
                )
              }
            >
              <ShoppingCart /> Add to cart
            </Button>
            <Button asChild variant="outlineBrass" size="lg">
              <Link to="/cart">View cart</Link>
            </Button>
          </div>

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-brass" /> Free shipping over $250 — otherwise $19.50
              flat.
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brass" /> Pay cash on delivery, by transfer, or in
              store.
            </p>
          </div>
        </div>
      </div>

      {(related.data ?? []).length > 0 && (
        <section className="mt-16">
          <h2 className="text-3xl">Fits the same job</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(related.data ?? []).map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
