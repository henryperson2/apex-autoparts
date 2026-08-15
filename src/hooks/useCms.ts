import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type {
  CmsPage,
  HomepageSection,
  NavItem,
  PageSection,
  SiteSetting,
  Testimonial,
} from "@/lib/cms";
import { settingsMap } from "@/lib/cms";

export function useSiteSettings() {
  const query = useQuery({
    queryKey: ["site_settings"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as SiteSetting[];
    },
  });

  return { ...query, settings: settingsMap(query.data) };
}

export function useNavItems(location: "header" | "footer") {
  return useQuery({
    queryKey: ["nav_items", location],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nav_items")
        .select("*")
        .eq("location", location)
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as NavItem[];
    },
  });
}

export function useHomepageSections() {
  return useQuery({
    queryKey: ["homepage_sections", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as HomepageSection[];
    },
  });
}

export function usePublishedTestimonials() {
  return useQuery({
    queryKey: ["testimonials", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Testimonial[];
    },
  });
}

export function useCmsPage(slug: string) {
  return useQuery({
    queryKey: ["cms_page", slug],
    queryFn: async () => {
      const { data: page, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      if (!page) return null;

      const { data: sections, error: sectionError } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_id", (page as CmsPage).id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (sectionError) throw sectionError;

      return { page: page as CmsPage, sections: (sections ?? []) as PageSection[] };
    },
  });
}
