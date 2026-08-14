import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { unitPrice, type Category, type Product } from "@/lib/store";

const searchSchema = z.object({
  category: z.string().optional().default(""),
  q: z.string().optional().default(""),
  sort: z.enum(["featured", "price-asc", "price-desc", "name"]).optional().default("featured"),
});

export const Route = createFileRoute("/products/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Parts Catalog — Brakes, Engine, Suspension | Apex Auto Parts" },
      {
        name: "description",
        content:
          "Browse the full Apex Auto Parts catalog: brake kits, engine components, suspension, filters, electrical and drivetrain parts with fitment notes.",
      },
      { property: "og:title", content: "Parts Catalog | Apex Auto Parts" },
      {
        property: "og:description",
        content: "Filter by system, brand and price across our full auto parts inventory.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { category, q, sort } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { addItem } = useCart();

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const products = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  const term = q.trim().toLowerCase();
  let visible = (products.data ?? []).filter((product) => {
    const matchesCategory = !category || product.categories?.slug === category;
    const matchesTerm =
      !term ||
      [product.name, product.brand, product.sku, product.fitment, product.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    return matchesCategory && matchesTerm;
  });

  visible = [...visible].sort((a, b) => {
    if (sort === "price-asc") return unitPrice(a) - unitPrice(b);
    if (sort === "price-desc") return unitPrice(b) - unitPrice(a);
    if (sort === "name") return a.name.localeCompare(b.name);
    return Number(b.is_featured) - Number(a.is_featured);
  });

  const setSearch = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const handleAdd = (product: Product) => {
    addItem.mutate(
      { productId: product.id },
      {
        onSuccess: () => toast.success(`${product.name} added to cart`),
        onError: () => toast.error("Could not add that part. Try again."),
      },
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="label-stencil text-sm text-brass">Catalog</p>
      <h1 className="mt-1 text-5xl">All parts</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {visible.length} part{visible.length === 1 ? "" : "s"} in stock and ready to ship. Not sure
        on fitment? Send us your VIN.
      </p>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row">
        {/* FILTERS */}
        <aside className="lg:w-64 lg:shrink-0">
          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-2 label-stencil text-sm">
              <SlidersHorizontal className="h-4 w-4 text-brass" /> Filters
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                placeholder="Search parts or SKU"
                className="pl-9"
                onChange={(event) => setSearch({ q: event.target.value })}
              />
            </div>

            <p className="mt-6 label-stencil text-xs text-muted-foreground">Department</p>
            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => setSearch({ category: "" })}
                className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                  category === "" ? "bg-muted text-brass" : ""
                }`}
              >
                All departments
              </button>
              {(categories.data ?? []).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSearch({ category: item.slug })}
                  className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                    category === item.slug ? "bg-muted text-brass" : ""
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <p className="mt-6 label-stencil text-xs text-muted-foreground">Sort</p>
            <div className="mt-2 space-y-1">
              {(
                [
                  ["featured", "Featured first"],
                  ["price-asc", "Price: low to high"],
                  ["price-desc", "Price: high to low"],
                  ["name", "Name A–Z"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSearch({ sort: value })}
                  className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                    sort === value ? "bg-muted text-brass" : ""
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* GRID */}
        <div className="flex-1">
          {products.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-md border border-border bg-card p-12 text-center">
              <h2 className="text-2xl">No parts match that</h2>
              <p className="mt-2 text-muted-foreground">
                Try a broader search or clear your filters.
              </p>
              <Button
                variant="brass"
                className="mt-6"
                onClick={() => setSearch({ category: "", q: "", sort: "featured" })}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={handleAdd}
                  adding={addItem.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
