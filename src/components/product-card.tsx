import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency, unitPrice, type Product } from "@/lib/store";

export function ProductCard({
  product,
  onAdd,
  adding,
}: {
  product: Product;
  onAdd?: (product: Product) => void;
  adding?: boolean;
}) {
  const price = unitPrice(product);
  const onSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-lift">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-4/3 overflow-hidden surface-steel"
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-5xl text-brass/25 transition-transform duration-300 group-hover:scale-110">
            {product.brand ?? "APEX"}
          </span>
        </span>
        <span className="absolute left-0 top-0 h-1 w-full diagonal-hazard opacity-40" />
        {onSale && (
          <span className="absolute right-2 top-3 rounded bg-brass px-2 py-0.5 label-stencil text-xs text-brass-foreground">
            Deal
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute bottom-2 left-2 rounded bg-destructive px-2 py-0.5 label-stencil text-xs text-destructive-foreground">
            Backorder
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="label-stencil text-xs text-muted-foreground">
          {product.categories?.name ?? product.brand} · {product.sku}
        </p>
        <h3 className="mt-1 text-lg leading-tight">
          <Link to="/products/$slug" params={{ slug: product.slug }} className="hover:text-brass">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.fitment}</p>

        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <span className="font-display text-2xl">{formatCurrency(price)}</span>
            {onSale && (
              <span className="ml-2 text-sm text-muted-foreground line-through">
                {formatCurrency(Number(product.price))}
              </span>
            )}
          </div>
          {onAdd && (
            <Button
              variant="brass"
              size="sm"
              disabled={adding}
              onClick={() => onAdd(product)}
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus /> Add
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
