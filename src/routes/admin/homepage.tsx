import { useState } from "react";
import { Plus } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import type { HomepageSection } from "@/lib/cms";

import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/homepage")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Homepage | Apex Admin" },
      { name: "description", content: "Edit hero, featured and promo sections of the public homepage." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Homepage | Apex Admin" },
      { property: "og:description", content: "Edit hero, featured and promo sections of the public homepage." },
    ],
  }),
  component: () => (
    <AdminShell>
      <Panel />
    </AdminShell>
  ),
});


function Panel() {
  const list = useAdminList<HomepageSection>("homepage_sections", {
    orderBy: "sort_order",
    ascending: true,
  });
  const { create, update, remove } = useAdminMutations("homepage_sections");

  return (
    <>
      <PanelHeader
        title="Homepage"
        description="Sections render on the public homepage in this order."
        action={
          <Button
            variant="brass"
            onClick={() =>
              create.mutate({
                kind: "text",
                title: "New section",
                body: "Section copy",
                sort_order: (list.data?.length ?? 0) + 1,
                is_published: false,
              })
            }
          >
            <Plus /> Add section
          </Button>
        }
      />
      {list.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {(list.data ?? []).map((section) => (
        <SectionEditor
          key={section.id}
          section={section}
          onSave={(values) => update.mutate({ id: section.id, values })}
          onDelete={() => remove.mutate(section.id)}
          pending={update.isPending}
        />
      ))}
    </>
  );
}

function SectionEditor({
  section,
  onSave,
  onDelete,
  pending,
}: {
  section: HomepageSection;
  onSave: (values: Record<string, unknown>) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    eyebrow: section.eyebrow ?? "",
    title: section.title ?? "",
    subtitle: section.subtitle ?? "",
    body: section.body ?? "",
    image_url: section.image_url ?? "",
    video_url: section.video_url ?? "",
    cta_label: section.cta_label ?? "",
    cta_href: section.cta_href ?? "",
    cta2_label: section.cta2_label ?? "",
    cta2_href: section.cta2_href ?? "",
    sort_order: String(section.sort_order),
    is_published: section.is_published,
    items: JSON.stringify(section.items ?? [], null, 2),
  });
  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    let items: unknown = [];
    try {
      items = JSON.parse(form.items || "[]");
    } catch {
      items = [];
    }
    onSave({
      eyebrow: form.eyebrow || null,
      title: form.title || null,
      subtitle: form.subtitle || null,
      body: form.body || null,
      image_url: form.image_url || null,
      video_url: form.video_url || null,
      cta_label: form.cta_label || null,
      cta_href: form.cta_href || null,
      cta2_label: form.cta2_label || null,
      cta2_href: form.cta2_href || null,
      sort_order: Number(form.sort_order) || 0,
      is_published: form.is_published,
      items,
    });
  };

  return (
    <AdminCard title={`${section.kind} — ${section.title ?? "untitled"}`}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Eyebrow" value={form.eyebrow} onChange={set("eyebrow")} />
        <TextField label="Heading" value={form.title} onChange={set("title")} />
        <TextField label="Subtitle" value={form.subtitle} onChange={set("subtitle")} />
        <TextField label="Order" type="number" value={form.sort_order} onChange={set("sort_order")} />
        <div className="md:col-span-2">
          <AreaField label="Description" value={form.body} onChange={set("body")} />
        </div>
        <MediaField label="Image" value={form.image_url} onChange={set("image_url")} />
        <MediaField label="Video" value={form.video_url} onChange={set("video_url")} kind="video" />
        <TextField label="Button text" value={form.cta_label} onChange={set("cta_label")} />
        <TextField label="Button link" value={form.cta_href} onChange={set("cta_href")} />
        <TextField label="Second button text" value={form.cta2_label} onChange={set("cta2_label")} />
        <TextField label="Second button link" value={form.cta2_href} onChange={set("cta2_href")} />
        <div className="md:col-span-2">
          <AreaField label="List items (JSON: title / copy)" value={form.items} onChange={set("items")} rows={5} />
        </div>
        <ToggleField label="Published" checked={form.is_published} onChange={set("is_published")} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <SaveButton onClick={save} pending={pending} />
        <ConfirmDelete onConfirm={onDelete} description="This homepage section will be removed." />
      </div>
    </AdminCard>
  );
}
