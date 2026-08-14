import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { PAYMENT_METHODS, formatCurrency } from "@/lib/store";

export const Route = createFileRoute("/order-confirmed")({
  validateSearch: z.object({
    order: z.string().optional().default(""),
    method: z.string().optional().default("cash_on_delivery"),
    total: z.coerce.number().optional().default(0),
  }),
  head: () => ({
    meta: [
      { title: "Order Confirmed | Apex Auto Parts" },
      {
        name: "description",
        content:
          "Your Apex Auto Parts order is logged. Quote your order number on delivery, transfer or at the counter.",
      },
      { property: "og:title", content: "Order Confirmed | Apex Auto Parts" },
      { property: "og:description", content: "Your parts order has been received." },
    ],
  }),
  component: OrderConfirmedPage,
});

function OrderConfirmedPage() {
  const { order, method, total } = Route.useSearch();
  const payment = PAYMENT_METHODS.find((option) => option.value === method);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <div className="rounded-md border border-brass/40 bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-brass" />
        <h1 className="mt-5 text-4xl">Order received</h1>
        <p className="mt-3 text-muted-foreground">
          Our counter team is picking your parts now. Keep this number handy.
        </p>

        <div className="mt-7 rounded surface-steel p-5">
          <p className="label-stencil text-xs text-steel-foreground/70">Order number</p>
          <p className="font-display text-4xl text-brass">{order || "AP-PENDING"}</p>
        </div>

        <dl className="mt-6 space-y-2 text-left text-sm">
          <div className="flex justify-between border-b border-border pb-2">
            <dt className="text-muted-foreground">Payment method</dt>
            <dd>{payment?.label ?? "Offline"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Amount due</dt>
            <dd className="font-display text-xl">{formatCurrency(total)}</dd>
          </div>
        </dl>

        <p className="mt-5 text-sm text-muted-foreground">{payment?.blurb}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="brass" size="lg">
            <Link to="/products">Keep shopping</Link>
          </Button>
          <Button asChild variant="outlineBrass" size="lg">
            <Link to="/orders">Order history</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
