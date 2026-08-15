import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "super_admin" | "admin" | null;

/** Reads the signed-in user's administrator role from the database (RLS-scoped). */
export function useAdminRole() {
  return useQuery({
    queryKey: ["admin_role"],
    staleTime: 15_000,
    retry: false,
    queryFn: async (): Promise<{ role: AdminRole; userId: string | null; email: string | null }> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return { role: null, userId: null, email: null };

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;

      const roles = (data ?? []).map((row) => row.role as string);
      const role: AdminRole = roles.includes("super_admin")
        ? "super_admin"
        : roles.includes("admin")
          ? "admin"
          : null;

      return { role, userId: user.id, email: user.email ?? null };
    },
  });
}
