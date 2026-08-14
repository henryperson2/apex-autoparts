import { Link } from "@tanstack/react-router";
import { Banknote, Clock, Phone, Truck, Wrench } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="surface-steel mt-20 border-t border-brass/25">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded bg-brass text-brass-foreground">
              <Wrench className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl leading-none">
              Apex<span className="text-brass">Parts</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-steel-foreground/70">
            Hard-wearing replacement and performance parts for daily drivers, work trucks and
            weekend builds. Counter staff who actually turn wrenches.
          </p>
        </div>

        <div>
          <h4 className="text-brass text-lg">Shop</h4>
          <ul className="mt-4 space-y-2 text-sm text-steel-foreground/75">
            <li>
              <Link to="/products" className="hover:text-brass">
                All parts
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-brass">
                Your cart
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-brass">
                Order history
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-brass">
                Account
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-brass text-lg">Store</h4>
          <ul className="mt-4 space-y-3 text-sm text-steel-foreground/75">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 text-brass" /> (555) 018-4420
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 text-brass" /> Mon–Sat, 7am – 7pm
            </li>
            <li className="flex items-start gap-2">
              <Truck className="mt-0.5 h-4 w-4 text-brass" /> Free shipping over $250
            </li>
            <li className="flex items-start gap-2">
              <Banknote className="mt-0.5 h-4 w-4 text-brass" /> Pay on delivery, transfer or in store
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-brass text-lg">Help</h4>
          <ul className="mt-4 space-y-2 text-sm text-steel-foreground/75">
            <li>
              <Link to="/about" className="hover:text-brass">
                About the workshop
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-brass">
                Contact & fitment help
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-brass/15 px-4 py-5 text-center text-xs text-steel-foreground/55">
        © {new Date().getFullYear()} Apex Auto Parts. All prices in USD. No online card payments —
        offline payment only.
      </div>
    </footer>
  );
}
