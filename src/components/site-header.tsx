import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart, User, Wrench, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useNavItems, useSiteSettings } from "@/hooks/useCms";

const FALLBACK_NAV = [
  { id: "home", href: "/", label: "Home" },
  { id: "catalog", href: "/products", label: "Catalog" },
  { id: "about", href: "/about", label: "Workshop" },
  { id: "contact", href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { settings } = useSiteSettings();
  const navQuery = useNavItems("header");

  const nav = (navQuery.data ?? []).length
    ? (navQuery.data ?? []).map((item) => ({ id: item.id, href: item.href, label: item.label }))
    : FALLBACK_NAV;

  const logoText = settings["logo_text"] || "ApexParts";
  const logoSplit = Math.max(1, Math.ceil(logoText.length / 2));

  return (
    <header className="sticky top-0 z-50 surface-steel border-b border-brass/25">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-brass text-brass-foreground">
            <Wrench className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl leading-none tracking-wide">
            {logoText.slice(0, logoSplit)}
            <span className="text-brass">{logoText.slice(logoSplit)}</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="label-stencil text-sm text-steel-foreground/75 transition-colors hover:text-brass"
              activeProps={{ className: "text-brass" }}
              activeOptions={{ exact: item.href === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="text-steel-foreground hover:text-brass">
            <Link to="/products" aria-label="Search parts">
              <Search />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="text-steel-foreground hover:text-brass">
            <Link to={user ? "/orders" : "/auth"} aria-label={user ? "My orders" : "Sign in"}>
              <User />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative text-steel-foreground hover:text-brass"
          >
            <Link to="/cart" aria-label="Cart">
              <ShoppingCart />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brass px-1 text-[10px] font-bold text-brass-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-steel-foreground hover:text-brass md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-brass/20 bg-background/5 px-4 pb-4 pt-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => setOpen(false)}
              className="label-stencil block py-2 text-steel-foreground/80 hover:text-brass"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
