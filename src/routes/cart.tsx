import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { cartSubtotal, formatCurrency, shippingCost, unitPrice } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | Apex Auto Parts" },
      {
        name: "description",
        content:
          "Review the auto parts in your cart, adjust quantities and continue to offline checkout at Apex Auto Parts.",
      },
      { property: "og:title", content: "Your Cart | Apex Auto Parts" },
      { property: "og:description", content: "Review your parts before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, isLoading, updateQuantity, removeItem, clearCart } = useCart();
  const subtotal = cartSubtotal(lines);
  const shipping = shippingCost(subtotal, null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="h-72 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <ShoppingCart className="mx-auto h-12 w-12 text-brass" />
        <h1 className="mt-5 text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Nothing on the bench yet. Pull something off the shelf.
        </p>
        <Button asChild variant="brass" size="lg" className="mt-7">
          <Link to="/products">Browse the catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="label-stencil text-sm text-brass">Order build</p>
      <h1 className="mt-1 text-5xl">Your cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {lines.map((line) => (
            <div
              key={line.id}
              className="flex gap-4 rounded-md border border-border bg-card p-4"
            >
              <Link
                to="/products/$slug"
                params={{ slug: line.product.slug }}
                className="relative hidden h-24 w-28 shrink-0 items-center justify-center rounded surface-steel sm:flex"
              >
                <span className="font-display text-2xl text-brass/30">
                  {line.product.brand ?? "APEX"}
                </span>
              </Link>

              <div className="flex-1">
                <p className="label-stencil text-xs text-muted-foreground">
                  {line.product.categories?.name} · {line.product.sku}
                </p>
                <h2 className="text-lg leading-tight">
                  <Link
                    to="/products/$slug"
                    params={{ slug: line.product.slug }}
                    className="hover:text-brass"
                  >
                    {line.product.name}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatCurrency(unitPrice(line.product))} each
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded border border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        updateQuantity.mutate({ itemId: line.id, quantity: line.quantity - 1 })
                      }
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center font-display text-lg">{line.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Increase quantity"
                      onClick={() =>
                        updateQuantity.mutate({ itemId: line.id, quantity: line.quantity + 1 })
                      }
                    >
                      <Plus />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem.mutate(line.id)}
                  >
                    <Trash2 /> Remove
                  </Button>
                </div>
              </div>

              <div className="text-right font-display text-2xl">
                {formatCurrency(unitPrice(line.product) * line.quantity)}
              </div>
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => clearCart.mutate()}
          >
            Clear cart
          </Button>
        </div>

        <aside className="h-fit rounded-md border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="text-2xl">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
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
            <span className="label-stencil text-sm">Total</span>
            <span className="font-display text-3xl">{formatCurrency(subtotal + shipping)}</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Pay offline: cash on delivery, bank transfer, or at the counter (shipping waived on
            pickup).
          </p>
          <Button asChild variant="brass" size="lg" className="mt-5 w-full">
            <Link to="/checkout">Continue to checkout</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
            <Link to="/products">Keep shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
