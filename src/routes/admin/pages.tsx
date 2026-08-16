import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import {
  AdminCard,
  AreaField,
  ConfirmDelete,
  MediaField,
  PanelHeader,
  SaveButton,
  TextField,
  ToggleField,
  useAdminList,
  useAdminMutations,
} from "@/components/admin/admin-kit";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { CmsPage, PageSection } from "@/lib/cms";

export const Route = createFileRoute("/admin/pages")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pages | Apex Admin" },
      { name: "description", content: "Edit the content of the About, Contact and other website pages." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Pages | Apex Admin" },
      { property: "og:description", content: "Website page content editor." },
    ],
  }),
  component: () => (
    <AdminShell>
      <Panel />
    </AdminShell>
  ),
});

function Panel() {
  const list = useAdminList<CmsPage>("pages", { orderBy: "sort_order", ascending: true });
  const { create, update, remove } = useAdminMutations("pages");

  return (
    <>
      <PanelHeader
        title="Website pages"
        description="Titles, intros, SEO text and content blocks for each page."
        action={
          <Button
            variant="brass"
            onClick={() =>
              create.mutate({
                slug: `page-${Date.now().toString().slice(-5)}`,
                title: "New page",
                is_published: false,
                sort_order: (list.data?.length ?? 0) + 1,
              })
            }
          >
            <Plus /> Add page
          </Button>
        }
      />
      {(list.data ?? []).map((page) => (
        <PageEditor
          key={page.id}
          page={page}
          pending={update.isPending}
          onSave={(values) => update.mutate({ id: page.id, values })}
          onDelete={() => remove.mutate(page.id)}
        />
      ))}
    </>
  );
}

function PageEditor({
  page,
  onSave,
  onDelete,
  pending,
}: {
  page: CmsPage;
  onSave: (values: Record<string, unknown>) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    slug: page.slug,
    title: page.title,
    eyebrow: page.eyebrow ?? "",
    intro: page.intro ?? "",
    seo_title: page.seo_title ?? "",
    seo_description: page.seo_description ?? "",
    hero_image_url: page.hero_image_url ?? "",
    sort_order: String(page.sort_order),
    is_published: page.is_published,
  });
  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AdminCard title={page.title}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Page title" value={form.title} onChange={set("title")} />
        <TextField label="URL slug" value={form.slug} onChange={set("slug")} />
        <TextField label="Eyebrow / kicker" value={form.eyebrow} onChange={set("eyebrow")} />
        <TextField label="Order" type="number" value={form.sort_order} onChange={set("sort_order")} />
        <div className="md:col-span-2">
          <AreaField label="Intro" value={form.intro} onChange={set("intro")} rows={3} />
        </div>
        <TextField label="SEO title" value={form.seo_title} onChange={set("seo_title")} />
        <TextField label="SEO description" value={form.seo_description} onChange={set("seo_description")} />
        <div className="md:col-span-2">
          <MediaField label="Hero image" value={form.hero_image_url} onChange={set("hero_image_url")} />
        </div>
        <ToggleField label="Published" checked={form.is_published} onChange={set("is_published")} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <SaveButton
          pending={pending}
          onClick={() =>
            onSave({
              slug: form.slug,
              title: form.title,
              eyebrow: form.eyebrow || null,
              intro: form.intro || null,
              seo_title: form.seo_title || null,
              seo_description: form.seo_description || null,
              hero_image_url: form.hero_image_url || null,
              sort_order: Number(form.sort_order) || 0,
              is_published: form.is_published,
            })
          }
        />
        <ConfirmDelete onConfirm={onDelete} description="The page and its content blocks are removed." />
      </div>

      <PageSections pageId={page.id} />
    </AdminCard>
  );
}

function PageSections({ pageId }: { pageId: string }) {
  const { create, update, remove } = useAdminMutations("page_sections");
  const sections = useQuery({
    queryKey: ["admin", "page_sections", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_id", pageId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PageSection[];
    },
  });

  return (
    <div className="mt-6 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="label-stencil text-sm">Content blocks</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            create.mutate({
              page_id: pageId,
              heading: "New block",
              sort_order: (sections.data?.length ?? 0) + 1,
            })
          }
        >
          <Plus className="h-4 w-4" /> Add block
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        {(sections.data ?? []).map((section) => (
          <SectionEditor
            key={section.id}
            section={section}
            pending={update.isPending}
            onSave={(values) => update.mutate({ id: section.id, values })}
            onDelete={() => remove.mutate(section.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onSave,
  onDelete,
  pending,
}: {
  section: PageSection;
  onSave: (values: Record<string, unknown>) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    heading: section.heading ?? "",
    body: section.body ?? "",
    image_url: section.image_url ?? "",
    cta_label: section.cta_label ?? "",
    cta_href: section.cta_href ?? "",
    sort_order: String(section.sort_order),
    is_published: section.is_published,
  });
  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="rounded border border-border p-3">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Heading" value={form.heading} onChange={set("heading")} />
        <TextField label="Order" type="number" value={form.sort_order} onChange={set("sort_order")} />
        <div className="md:col-span-2">
          <AreaField label="Body" value={form.body} onChange={set("body")} rows={3} />
        </div>
        <TextField label="Button label" value={form.cta_label} onChange={set("cta_label")} />
        <TextField label="Button link" value={form.cta_href} onChange={set("cta_href")} />
        <div className="md:col-span-2">
          <MediaField label="Image" value={form.image_url} onChange={set("image_url")} />
        </div>
        <ToggleField label="Published" checked={form.is_published} onChange={set("is_published")} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <SaveButton
          pending={pending}
          onClick={() =>
            onSave({
              heading: form.heading || null,
              body: form.body || null,
              image_url: form.image_url || null,
              cta_label: form.cta_label || null,
              cta_href: form.cta_href || null,
              sort_order: Number(form.sort_order) || 0,
              is_published: form.is_published,
            })
          }
        />
        <ConfirmDelete onConfirm={onDelete} description="This content block will be deleted." />
      </div>
    </div>
  );
}
