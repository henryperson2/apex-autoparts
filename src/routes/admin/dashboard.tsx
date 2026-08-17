import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Mail, Package, Send, Star, Users } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard, PanelHeader } from "@/components/admin/admin-kit";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/store";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Apex Auto Parts" },
      { name: "description", content: "Store control centre overview for authorized administrators." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Dashboard | Apex Auto Parts" },
      { property: "og:description", content: "Manage products, content, orders and media." },
    ],
  }),
  component: () => (
    <AdminShell>
      <DashboardPanel />
    </AdminShell>
  ),
});

function useStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [products, orders, messages, subscribers, media, testimonials, customers] =
        await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("total, status, created_at"),
          supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
          supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
          supabase.from("media_assets").select("id", { count: "exact", head: true }),
          supabase.from("testimonials").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
        ]);

      const orderRows = (orders.data ?? []) as { total: number; status: string; created_at: string }[];
      return {
        products: products.count ?? 0,
        orders: orderRows.length,
        openOrders: orderRows.filter((o) => !["completed", "cancelled"].includes(o.status)).length,
        revenue: orderRows.reduce((sum, o) => sum + Number(o.total), 0),
        newMessages: messages.count ?? 0,
        subscribers: subscribers.count ?? 0,
        media: media.count ?? 0,
        testimonials: testimonials.count ?? 0,
        customers: customers.count ?? 0,
      };
    },
  });
}

function DashboardPanel() {
  const stats = useStats();
  const recent = useQuery({
    queryKey: ["admin", "recent_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const s = stats.data;

  const tiles = [
    { label: "Products", value: s?.products ?? 0, icon: Package, to: "/admin/products" as const },
    { label: "Orders", value: s?.orders ?? 0, icon: Package, to: "/admin/orders" as const },
    { label: "New inquiries", value: s?.newMessages ?? 0, icon: Mail, to: "/admin/messages" as const },
    { label: "Customers", value: s?.customers ?? 0, icon: Users, to: "/admin/customers" as const },
    { label: "Reviews", value: s?.testimonials ?? 0, icon: Star, to: "/admin/testimonials" as const },
    { label: "Media files", value: s?.media ?? 0, icon: ImageIcon, to: "/admin/media" as const },
    { label: "Subscribers", value: s?.subscribers ?? 0, icon: Send, to: "/admin/messages" as const },
  ];



  return (
    <>
      <PanelHeader
        title="Dashboard"
        description="Everything on the public website is managed from here."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className="rounded-md border border-border bg-card p-4 transition-colors hover:border-brass"
          >
            <div className="flex items-center justify-between">
              <p className="label-stencil text-xs text-muted-foreground">{tile.label}</p>
              <tile.icon className="h-4 w-4 text-brass" />
            </div>
            <p className="mt-2 font-display text-4xl leading-none">{tile.value}</p>
          </Link>
        ))}
        <div className="rounded-md border border-brass/40 bg-card p-4">
          <p className="label-stencil text-xs text-muted-foreground">Order value</p>
          <p className="mt-2 font-display text-4xl leading-none text-brass">
            {formatCurrency(s?.revenue ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{s?.openOrders ?? 0} still open</p>
        </div>
      </div>

      <AdminCard title="Recent orders">
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2 sm:px-2">Order</th>
                <th className="px-4 py-2 sm:px-2">Customer</th>
                <th className="px-4 py-2 sm:px-2">Status</th>
                <th className="px-4 py-2 text-right sm:px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(recent.data ?? []).map((order) => (
                <tr key={order.id} className="border-b border-border/60">
                  <td className="px-4 py-2 font-mono text-xs sm:px-2">{order.order_number}</td>
                  <td className="px-4 py-2 sm:px-2">{order.customer_name}</td>
                  <td className="px-4 py-2 sm:px-2">{order.status}</td>
                  <td className="px-4 py-2 text-right sm:px-2">{formatCurrency(Number(order.total))}</td>
                </tr>
              ))}
              {(recent.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground sm:px-2">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </>
  );
}
