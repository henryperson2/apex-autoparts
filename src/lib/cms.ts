export type SiteSetting = {
  key: string;
  value: string | null;
  label: string;
  group_name: string;
  input_type: string;
  sort_order: number;
};

export type NavItem = {
  id: string;
  location: string;
  group_label: string | null;
  label: string;
  href: string;
  sort_order: number;
  is_visible: boolean;
};

export type HomepageSection = {
  id: string;
  kind: string;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  video_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
  cta2_label: string | null;
  cta2_href: string | null;
  items: unknown;
  sort_order: number;
  is_published: boolean;
};

export type SectionItem = { title?: string; copy?: string };

export type Testimonial = {
  id: string;
  customer_name: string;
  location: string | null;
  quote: string;
  rating: number;
  avatar_url: string | null;
  review_date: string;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  intro: string | null;
  seo_title: string | null;
  seo_description: string | null;
  hero_image_url: string | null;
  is_published: boolean;
  sort_order: number;
};

export type PageSection = {
  id: string;
  page_id: string;
  heading: string | null;
  body: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
  sort_order: number;
  is_published: boolean;
};

export type MediaAsset = {
  id: string;
  title: string | null;
  alt_text: string | null;
  kind: string;
  storage_path: string | null;
  url: string;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
  created_at: string;
};

export function settingsMap(rows: SiteSetting[] | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows ?? []) map[row.key] = row.value ?? "";
  return map;
}

export function sectionItems(section: Pick<HomepageSection, "items">): SectionItem[] {
  const items = section.items;
  if (Array.isArray(items)) return items as SectionItem[];
  return [];
}

export const ORDER_STATUSES = [
  "received",
  "processing",
  "packed",
  "shipped",
  "completed",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = ["pending", "paid", "refunded", "failed"] as const;

export const AVAILABILITY_OPTIONS = [
  "available",
  "unavailable",
  "sold",
  "reserved",
] as const;

export const MESSAGE_STATUSES = ["new", "contacted", "completed"] as const;
