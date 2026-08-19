import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import {
  PAYMENT_METHODS,
  cartSubtotal,
  formatCurrency,
  shippingCost,
  unitPrice,
  type PaymentMethod,
} from "@/lib/store";
import { z } from "zod";

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(100),
  customer_email: z.string().trim().email("Enter a valid email").max(255),
  customer_phone: z
    .string()
    .trim()
    .min(7, "Enter a reachable phone number")
    .max(30)
    .regex(/^[\d+()\-\s]+$/, "Digits, spaces and + ( ) - only"),
  shipping_address: z.string().trim().min(5, "Enter your street address").max(300),
  shipping_city: z.string().trim().min(2, "Enter your city").max(100),
  shipping_postal_code: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(1000, "Notes must be under 1000 characters").optional(),
});


export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Offline Payment | Apex Auto Parts" },
      {
        name: "description",
        content:
          "Complete your auto parts order and choose cash on delivery, bank transfer or pay in store. No card details required.",
      },
      { property: "og:title", content: "Checkout | Apex Auto Parts" },
      {
        property: "og:description",
        content: "Offline payment checkout: cash on delivery, bank transfer or pay in store.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lines, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
    shipping_city: "",
    shipping_postal_code: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = cartSubtotal(lines);
  const shipping = shippingCost(subtotal, method);
  const total = subtotal + shipping;

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => {
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-destructive">{errors[key]}</p> : null;


  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-4xl">Nothing to check out</h1>
        <p className="mt-3 text-muted-foreground">Add parts to your cart first.</p>
        <Button asChild variant="brass" className="mt-6">
          <Link to="/products">Browse the catalog</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {


      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id ?? null,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          shipping_address: form.shipping_address,
          shipping_city: form.shipping_city,
          shipping_postal_code: form.shipping_postal_code || null,
          notes: form.notes || null,
          payment_method: method,
          subtotal,
          shipping_cost: shipping,
          total,
        })
        .select("id, order_number")
        .single();
      if (orderError) throw orderError;

      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((line) => ({
          order_id: order.id,
          product_id: line.product.id,
          product_name: line.product.name,
          product_sku: line.product.sku,
          unit_price: unitPrice(line.product),
          quantity: line.quantity,
        })),
      );
      if (itemsError) throw itemsError;

      await clearCart.mutateAsync();
      navigate({
        to: "/order-confirmed",
        search: { order: order.order_number, method, total },
      });
    } catch {
      toast.error("We couldn't place that order. Check your details and retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="label-stencil text-sm text-brass">Step 2 of 2</p>
      <h1 className="mt-1 text-5xl">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-2xl">Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="customer_name">Full name</Label>
                <Input
                  id="customer_name"
                  maxLength={100}
                  value={form.customer_name}
                  onChange={set("customer_name")}
                  aria-invalid={Boolean(errors.customer_name)}
                  className="mt-1.5"
                />
                {fieldError("customer_name")}
              </div>
              <div>
                <Label htmlFor="customer_phone">Phone</Label>
                <Input
                  id="customer_phone"
                  maxLength={30}
                  value={form.customer_phone}
                  onChange={set("customer_phone")}
                  aria-invalid={Boolean(errors.customer_phone)}
                  className="mt-1.5"
                />
                {fieldError("customer_phone")}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  maxLength={255}
                  value={form.customer_email}
                  onChange={set("customer_email")}
                  aria-invalid={Boolean(errors.customer_email)}
                  className="mt-1.5"
                />
                {fieldError("customer_email")}
              </div>
            </div>
          </section>

          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-2xl">Delivery</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="shipping_address">Street address</Label>
                <Input
                  id="shipping_address"
                  maxLength={300}
                  value={form.shipping_address}
                  onChange={set("shipping_address")}
                  aria-invalid={Boolean(errors.shipping_address)}
                  className="mt-1.5"
                />
                {fieldError("shipping_address")}
              </div>
              <div>
                <Label htmlFor="shipping_city">City</Label>
                <Input
                  id="shipping_city"
                  maxLength={100}
                  value={form.shipping_city}
                  onChange={set("shipping_city")}
                  aria-invalid={Boolean(errors.shipping_city)}
                  className="mt-1.5"
                />
                {fieldError("shipping_city")}
              </div>

              <div>
                <Label htmlFor="shipping_postal_code">Postal code</Label>
                <Input
                  id="shipping_postal_code"
                  value={form.shipping_postal_code}
                  onChange={set("shipping_postal_code")}
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes (vehicle, VIN, gate code)</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={set("notes")}
                  className="mt-1.5"
                />
              </div>
            </div>
          </section>

          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-2xl">Payment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We don't take cards online — pick how you'd like to settle up.
            </p>
            <div className="mt-4 space-y-3">
              {PAYMENT_METHODS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors ${
                    method === option.value ? "border-brass bg-muted" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={option.value}
                    checked={method === option.value}
                    onChange={() => setMethod(option.value)}
                    className="mt-1 accent-[var(--brass)]"
                  />
                  <span>
                    <span className="label-stencil block">{option.label}</span>
                    <span className="text-sm text-muted-foreground">{option.blurb}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-md border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="text-2xl">Order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {line.quantity} × {line.product.name}
                </span>
                <span>{formatCurrency(unitPrice(line.product) * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatCurrency(shipping)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
            <span className="label-stencil text-sm">Total due</span>
            <span className="font-display text-3xl">{formatCurrency(total)}</span>
          </div>
          <Button type="submit" variant="brass" size="lg" className="mt-5 w-full" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Place order
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            You'll get an order number to quote at the counter or on delivery.
          </p>
        </aside>
      </form>
    </div>
  );
}
