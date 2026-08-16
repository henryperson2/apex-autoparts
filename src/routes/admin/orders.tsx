import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  AdminCard,
  AreaField,
  ConfirmDelete,
  PanelHeader,
  SaveButton,
  SelectField,
  useAdminList,
  useAdminMutations,
} from "@/components/admin/admin-kit";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/cms";

export const Route = createFileRoute("/admin/orders")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Orders | Apex Admin" },
      { name: "description", content: "Review customer orders, update status and payment state." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Orders | Apex Admin" },
      { property: "og:description", content: "Manage incoming parts orders." },
    ],
  }),
  component: () => (
    <AdminShell>
      <Panel />
    </AdminShell>
  ),
});

type AdminOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string | null;
  notes: string | null;
  payment_method: string;
  payment_status: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  admin_notes: string | null;
  created_at: string;
};

function Panel() {
  const list = useAdminList<AdminOrder>("orders", { orderBy: "created_at", ascending: false });
  const { update, remove } = useAdminMutations("orders");
  const [statusFilter, setStatusFilter] = useState("all");

  const orders = (list.data ?? []).filter(
    (order) => statusFilter === "all" || order.status === statusFilter,
  );

  return (
    <>
      <PanelHeader
        title="Orders"
        description="Live orders placed on the storefront. Status changes are visible to customers."
      />
      <AdminCard>
        <SelectField
          label="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All orders" },
            ...ORDER_STATUSES.map((value) => ({ value, label: value })),
          ]}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          {list.isLoading ? "Loading orders…" : `${orders.length} order(s)`}
        </p>
      </AdminCard>

      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          pending={update.isPending}
          onSave={(values) => update.mutate({ id: order.id, values })}
          onDelete={() => remove.mutate(order.id)}
        />
      ))}
    </>
  );
}

function OrderCard({
  order,
  onSave,
  onDelete,
  pending,
}: {
  order: AdminOrder;
  onSave: (values: Record<string, unknown>) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [notes, setNotes] = useState(order.admin_notes ?? "");

  const items = useQuery({
    queryKey: ["admin", "order_items", order.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("id, product_name, product_sku, unit_price, quantity")
        .eq("order_id", order.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AdminCard>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-tight">
            {order.order_number} · {order.customer_name}
          </p>
          <p className="text-xs text-muted-foreground">
            ${Number(order.total).toFixed(2)} · {order.payment_method.replace(/_/g, " ")} ·{" "}
            {order.status} / {order.payment_status} ·{" "}
            {new Date(order.created_at).toISOString().slice(0, 10)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Manage"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-sm text-muted-foreground">
              <p className="label-stencil text-xs text-foreground">Customer</p>
              <p>{order.customer_email}</p>
              <p>{order.customer_phone}</p>
              <p className="mt-2 label-stencil text-xs text-foreground">Deliver to</p>
              <p>
                {order.shipping_address}, {order.shipping_city} {order.shipping_postal_code ?? ""}
              </p>
              {order.notes && <p className="mt-2 italic">“{order.notes}”</p>}
            </div>
            <div className="text-sm">
              <p className="label-stencil text-xs text-muted-foreground">Items</p>
              <ul className="mt-1 space-y-1">
                {(items.data ?? []).map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="truncate">
                      {item.quantity}× {item.product_name}{" "}
                      <span className="text-muted-foreground">({item.product_sku})</span>
                    </span>
                    <span>${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Subtotal ${Number(order.subtotal).toFixed(2)} · Shipping $
                {Number(order.shipping_cost).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Order status"
              value={status}
              onChange={setStatus}
              options={ORDER_STATUSES.map((value) => ({ value, label: value }))}
            />
            <SelectField
              label="Payment status"
              value={paymentStatus}
              onChange={setPaymentStatus}
              options={PAYMENT_STATUSES.map((value) => ({ value, label: value }))}
            />
            <div className="md:col-span-2">
              <AreaField label="Internal notes" value={notes} onChange={setNotes} rows={2} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SaveButton
              pending={pending}
              onClick={() =>
                onSave({
                  status,
                  payment_status: paymentStatus,
                  admin_notes: notes || null,
                })
              }
            />
            <ConfirmDelete onConfirm={onDelete} description="The order and its line items are removed." />
          </div>
        </div>
      )}
    </AdminCard>
  );
}
