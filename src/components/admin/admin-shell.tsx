import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  ClipboardList,
  ExternalLink,
  FileText,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  ListTree,
  Loader2,
  LogOut,
  Mail,
  MessageSquareQuote,
  Menu,
  Package,
  Settings,
  Tags,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/messages", label: "Messages", icon: Mail },
  { to: "/admin/homepage", label: "Homepage", icon: Home },
  { to: "/admin/pages", label: "Pages", icon: FileText },
  { to: "/admin/media", label: "Media", icon: ImageIcon },
  { to: "/admin/testimonials", label: "Reviews", icon: MessageSquareQuote },
  { to: "/admin/navigation", label: "Navigation", icon: ListTree },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;


export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useAdminRole();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const denied = !isLoading && (isError || !data?.role);

  useEffect(() => {
    if (denied) navigate({ to: "/admin", replace: true });
  }, [denied, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin", replace: true });
  };

  if (isLoading || denied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-brass" />
      </div>
    );
  }

  const sidebar = (
    <nav className="space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="flex items-center gap-2.5 rounded px-3 py-2 text-sm text-steel-foreground/75 transition-colors hover:bg-brass/10 hover:text-brass"
          activeProps={{ className: "bg-brass/15 text-brass" }}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 surface-steel border-b border-brass/25">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <Button
            variant="ghost"
            size="icon"
            className="text-steel-foreground lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle admin menu"
          >
            {open ? <X /> : <Menu />}
          </Button>
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-brass text-brass-foreground">
              <Wrench className="h-4 w-4" />
            </span>
            <span className="font-display text-xl leading-none">
              Apex<span className="text-brass">Admin</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-steel-foreground/70 sm:flex">
              <BadgeCheck className="h-3.5 w-3.5 text-brass" />
              {data?.email} · {data?.role === "super_admin" ? "SUPER_ADMIN" : "ADMIN"}
            </span>
            <Button asChild variant="ghost" size="icon" className="text-steel-foreground" title="View site">
              <a href="/" target="_blank" rel="noreferrer" aria-label="Open public website">
                <ExternalLink />
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
        {open && <div className="border-t border-brass/20 px-3 pb-3 pt-2 lg:hidden">{sidebar}</div>}
      </header>

      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside
          className={cn(
            "sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto surface-steel p-3 lg:block",
          )}
        >
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1 space-y-5 p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
