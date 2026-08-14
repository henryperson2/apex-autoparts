import { createFileRoute, Link } from "@tanstack/react-router";
import { Gauge, Hammer, Truck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Workshop | Apex Auto Parts" },
      {
        name: "description",
        content:
          "Apex Auto Parts has supplied brakes, engine and suspension components since 1994 — stocked deep, fitment verified by working technicians.",
      },
      { property: "og:title", content: "About Apex Auto Parts" },
      {
        property: "og:description",
        content: "A parts counter run by technicians since 1994.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="surface-steel border-b border-brass/25">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <p className="label-stencil text-sm text-brass">Since 1994</p>
          <h1 className="mt-3 text-5xl text-steel-foreground sm:text-6xl">
            A parts counter run by people who turn wrenches
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-steel-foreground/75">
            We started as a two-bay shop that got tired of waiting on wrong parts. Three decades
            later we stock the components we'd fit to our own trucks — and we still check every
            fitment before it leaves the shelf.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            {
              icon: Hammer,
              title: "Tested, not just listed",
              copy: "Every line we carry has been fitted in our own bays before it hits the catalog.",
            },
            {
              icon: Users,
              title: "Real fitment advice",
              copy: "Send a VIN and a photo. A technician replies — not a chatbot.",
            },
            {
              icon: Truck,
              title: "Stocked deep",
              copy: "Most orders leave the same day. Free shipping once you pass $250.",
            },
            {
              icon: Gauge,
              title: "Street to strip",
              copy: "Daily-driver replacements and performance upgrades on the same shelf.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-md border border-border bg-card p-6">
              <item.icon className="h-7 w-7 text-brass" />
              <h2 className="mt-4 text-2xl">{item.title}</h2>
              <p className="mt-2 text-muted-foreground">{item.copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 border-t border-border pt-10 sm:grid-cols-3">
          {[
            ["31", "Years at the counter"],
            ["18k+", "Parts fitted last year"],
            ["4.9", "Average trade rating"],
          ].map(([stat, label]) => (
            <div key={label}>
              <p className="font-display text-5xl text-brass">{stat}</p>
              <p className="label-stencil mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Button asChild variant="brass" size="lg">
            <Link to="/products">Shop the catalog</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/contact">Talk to the counter</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
