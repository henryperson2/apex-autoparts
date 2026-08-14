import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PAYMENT_METHODS, formatCurrency } from "@/lib/store";

type OrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total: number;
  order_items: { id: string; product_name: string; quantity: number; unit_price: number }[];
};

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Your Orders | Apex Auto Parts" },
      {
        name: "description",
        content:
          "Review your Apex Auto Parts order history, payment method and fulfilment status for every parts order.",
      },
      { property: "og:title", content: "Your Orders | Apex Auto Parts" },
      { property: "og:description", content: "Order history and fulfilment status." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useAuth();

  const orders = useQuery({
    queryKey: ["orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, created_at, status, payment_method, payment_status, total, order_items(id, product_name, quantity, unit_price)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="h-64 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <PackageSearch className="mx-auto h-12 w-12 text-brass" />
        <h1 className="mt-5 text-4xl">Sign in to see your orders</h1>
        <p className="mt-3 text-muted-foreground">
          Orders placed as a guest are tracked by the order number on your confirmation.
        </p>
        <Button asChild variant="brass" size="lg" className="mt-7">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  const rows = orders.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="label-stencil text-sm text-brass">History</p>
      <h1 className="mt-1 text-5xl">Your orders</h1>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-md border border-border bg-card p-10 text-center">
          <h2 className="text-2xl">No orders yet</h2>
          <p className="mt-2 text-muted-foreground">Your first build has to start somewhere.</p>
          <Button asChild variant="brass" className="mt-6">
            <Link to="/products">Browse the catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map((order) => (
            <article key={order.id} className="rounded-md border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl text-brass">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()} ·{" "}
                    {PAYMENT_METHODS.find((m) => m.value === order.payment_method)?.label ??
                      order.payment_method}
                  </p>
                </div>
                <div className="text-right">
                  <span className="label-stencil rounded bg-muted px-2 py-1 text-xs">
                    {order.status}
                  </span>
                  <p className="mt-2 font-display text-2xl">{formatCurrency(Number(order.total))}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      {item.quantity} × {item.product_name}
                    </span>
                    <span>{formatCurrency(Number(item.unit_price) * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Payment status: {order.payment_status}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
