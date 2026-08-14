import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Banknote, ShieldCheck, Truck, Wrench } from "lucide-react";
import { toast } from "sonner";

import heroImage from "@/assets/hero-garage.jpg";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Apex Auto Parts — Brakes, Engine & Suspension Parts" },
      {
        name: "description",
        content:
          "Shop heavy-duty brakes, engine, suspension, filters and electrical parts. Offline payment: cash on delivery, bank transfer or pay in store.",
      },
      { property: "og:title", content: "Apex Auto Parts — Built For Performance" },
      {
        property: "og:description",
        content:
          "Replacement and performance auto parts with fitment help from people who turn wrenches. Free shipping over $250.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
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

  const featured = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("is_featured", true)
        .limit(8);
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

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
    <div>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt="Brake rotors, pistons and wrenches on a dark workshop bench"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[oklch(0.14_0.004_106)]/75" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-36">
          <p className="label-stencil text-brass text-sm">Est. 1994 · Counter + shipping</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[0.95] text-steel-foreground sm:text-7xl">
            Parts that <span className="text-brass-gradient">outlast</span> the job
          </h1>
          <p className="mt-6 max-w-xl text-lg text-steel-foreground/75">
            Brakes, engine internals, suspension, filters and electrical — stocked deep, priced
            straight, and backed by fitment advice from real technicians.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild variant="brass" size="xl">
              <Link to="/products">
                Shop the catalog <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outlineBrass" size="xl">
              <Link to="/contact">Fitment help</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Free over $250", copy: "Flat $19.50 shipping under that." },
            { icon: Banknote, title: "Offline payment", copy: "Cash, transfer or pay in store." },
            { icon: ShieldCheck, title: "Warranty backed", copy: "Up to 5 years on select parts." },
            { icon: Wrench, title: "Fitment checked", copy: "We verify before it ships." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <item.icon className="mt-0.5 h-6 w-6 shrink-0 text-brass" />
              <div>
                <p className="label-stencil text-base">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label-stencil text-sm text-brass">Browse by system</p>
            <h2 className="mt-1 text-4xl">Shop departments</h2>
          </div>
          <Button asChild variant="ghost" className="label-stencil hidden sm:inline-flex">
            <Link to="/products">
              All parts <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(categories.data ?? []).map((category) => (
            <Link
              key={category.id}
              to="/products"
              search={{ category: category.slug, q: "" }}
              className="group relative overflow-hidden rounded-md border border-border bg-card p-5 transition-colors hover:border-brass"
            >
              <span className="absolute -right-6 -top-6 font-display text-7xl text-muted opacity-60 transition-transform group-hover:scale-110">
                {category.sort_order.toString().padStart(2, "0")}
              </span>
              <h3 className="relative text-2xl">{category.name}</h3>
              <p className="relative mt-2 text-sm text-muted-foreground">{category.description}</p>
              <span className="relative mt-4 inline-flex items-center gap-1 label-stencil text-xs text-brass">
                Shop now <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="bg-card border-y border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="label-stencil text-sm text-brass">This week</p>
          <h2 className="mt-1 text-4xl">Counter favourites</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(featured.data ?? []).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAdd}
                adding={addItem.isPending}
              />
            ))}
          </div>
        </div>
      </section>

      {/* OFFLINE PAYMENT CALLOUT */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="surface-steel rounded-md p-8 sm:p-12">
          <p className="label-stencil text-sm text-brass">How you pay</p>
          <h2 className="mt-2 text-4xl text-steel-foreground">No cards. No online checkout fees.</h2>
          <p className="mt-4 max-w-2xl text-steel-foreground/75">
            Order online, then settle up the way that suits you — cash when the parts land, a bank
            transfer before dispatch, or straight at the counter when you collect.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Cash on delivery", "Pay the driver at your door or shop."],
              ["Bank transfer", "We send details; ships once cleared."],
              ["Pay in store", "Reserve online, collect and pay."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded border border-brass/25 p-4">
                <p className="label-stencil text-brass">{title}</p>
                <p className="mt-1 text-sm text-steel-foreground/70">{copy}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="brass" size="lg" className="mt-8">
            <Link to="/products">Start an order</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
