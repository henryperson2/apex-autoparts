import { Link } from "@tanstack/react-router";
import { Banknote, Clock, Loader2, Phone, Truck, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavItems, useSiteSettings } from "@/hooks/useCms";

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);


const FALLBACK_GROUPS: { label: string; items: { id: string; href: string; label: string }[] }[] = [
  {
    label: "Shop",
    items: [
      { id: "f-all", href: "/products", label: "All parts" },
      { id: "f-cart", href: "/cart", label: "Your cart" },
      { id: "f-orders", href: "/orders", label: "Order history" },
      { id: "f-account", href: "/auth", label: "Account" },
    ],
  },
  {
    label: "Help",
    items: [
      { id: "f-about", href: "/about", label: "About the workshop" },
      { id: "f-contact", href: "/contact", label: "Contact & fitment help" },
    ],
  },
];

export function SiteFooter() {
  const { settings } = useSiteSettings();
  const navQuery = useNavItems("footer");

  const groups = (() => {
    const items = navQuery.data ?? [];
    if (!items.length) return FALLBACK_GROUPS;
    const map = new Map<string, { id: string; href: string; label: string }[]>();
    for (const item of items) {
      const key = item.group_label || "Links";
      map.set(key, [...(map.get(key) ?? []), { id: item.id, href: item.href, label: item.label }]);
    }
    return [...map.entries()].map(([label, groupItems]) => ({ label, items: groupItems }));
  })();

  const logoText = settings["logo_text"] || "ApexParts";
  const logoSplit = Math.max(1, Math.ceil(logoText.length / 2));

  return (
    <footer className="surface-steel mt-20 border-t border-brass/25">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded bg-brass text-brass-foreground">
              <Wrench className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl leading-none">
              {logoText.slice(0, logoSplit)}
              <span className="text-brass">{logoText.slice(logoSplit)}</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-steel-foreground/70">
            {settings["footer_text"] ||
              "Hard-wearing replacement and performance parts for daily drivers, work trucks and weekend builds. Counter staff who actually turn wrenches."}
          </p>
        </div>

        {groups.map((group) => (
          <div key={group.label}>
            <h4 className="text-brass text-lg">{group.label}</h4>
            <ul className="mt-4 space-y-2 text-sm text-steel-foreground/75">
              {group.items.map((item) => (
                <li key={item.id}>
                  <Link to={item.href} className="hover:text-brass">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-brass text-lg">Store</h4>
          <ul className="mt-4 space-y-3 text-sm text-steel-foreground/75">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 text-brass" />
              <span>{settings["phone"] || "(555) 018-4420"}</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 text-brass" />
              <span>{settings["hours"] || "Mon–Sat, 7am – 7pm"}</span>
            </li>
            <li className="flex items-start gap-2">
              <Truck className="mt-0.5 h-4 w-4 text-brass" />
              <span>{settings["free_shipping_threshold"]
                ? `Free shipping over $${settings["free_shipping_threshold"]}`
                : "Free shipping over $250"}</span>
            </li>
            <li className="flex items-start gap-2">
              <Banknote className="mt-0.5 h-4 w-4 text-brass" />
              <span>{settings["service_area"] || "Pay on delivery, transfer or in store"}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-brass/15 px-4 py-5 text-center text-xs text-steel-foreground/55">
        {settings["copyright_text"] ||
          "© Apex Auto Parts. All prices in USD. No online card payments — offline payment only."}
      </div>
    </footer>
  );
}
