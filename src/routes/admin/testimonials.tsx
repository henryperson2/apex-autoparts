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
import type { Testimonial } from "@/lib/cms";

import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/testimonials")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reviews | Apex Admin" },
      { name: "description", content: "Add, edit, publish and reorder customer testimonials." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Reviews | Apex Admin" },
      { property: "og:description", content: "Add, edit, publish and reorder customer testimonials." },
    ],
  }),
  component: () => (
    <AdminShell>
      <Panel />
    </AdminShell>
  ),
});


function Panel() {
  const list = useAdminList<Testimonial>("testimonials", { orderBy: "sort_order", ascending: true });
  const { create, update, remove } = useAdminMutations("testimonials");

  return (
    <>
      <PanelHeader
        title="Reviews / testimonials"
        description="Only published reviews appear on the public website."
        action={
          <Button
            variant="brass"
            onClick={() =>
              create.mutate({
                customer_name: "New customer",
                quote: "Their review text",
                sort_order: (list.data?.length ?? 0) + 1,
                is_published: false,
              })
            }
          >
            <Plus /> Add review
          </Button>
        }
      />
      {(list.data ?? []).map((item) => (
        <ReviewEditor
          key={item.id}
          item={item}
          onSave={(values) => update.mutate({ id: item.id, values })}
          onDelete={() => remove.mutate(item.id)}
          pending={update.isPending}
        />
      ))}
    </>
  );
}

function ReviewEditor({
  item,
  onSave,
  onDelete,
  pending,
}: {
  item: Testimonial;
  onSave: (values: Record<string, unknown>) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    customer_name: item.customer_name,
    location: item.location ?? "",
    quote: item.quote,
    rating: String(item.rating),
    avatar_url: item.avatar_url ?? "",
    review_date: item.review_date,
    sort_order: String(item.sort_order),
    is_published: item.is_published,
    is_featured: item.is_featured,
  });
  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AdminCard title={item.customer_name}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Customer name" value={form.customer_name} onChange={set("customer_name")} />
        <TextField label="Location" value={form.location} onChange={set("location")} />
        <div className="md:col-span-2">
          <AreaField label="Review" value={form.quote} onChange={set("quote")} />
        </div>
        <TextField label="Rating (1-5)" type="number" value={form.rating} onChange={set("rating")} />
        <TextField label="Date" type="date" value={form.review_date} onChange={set("review_date")} />
        <MediaField label="Customer image" value={form.avatar_url} onChange={set("avatar_url")} />
        <TextField label="Order" type="number" value={form.sort_order} onChange={set("sort_order")} />
        <ToggleField label="Published" checked={form.is_published} onChange={set("is_published")} />
        <ToggleField label="Featured" checked={form.is_featured} onChange={set("is_featured")} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <SaveButton
          pending={pending}
          onClick={() =>
            onSave({
              customer_name: form.customer_name,
              location: form.location || null,
              quote: form.quote,
              rating: Number(form.rating) || 5,
              avatar_url: form.avatar_url || null,
              review_date: form.review_date,
              sort_order: Number(form.sort_order) || 0,
              is_published: form.is_published,
              is_featured: form.is_featured,
            })
          }
        />
        <ConfirmDelete onConfirm={onDelete} description="This review will be removed from the website." />
      </div>
    </AdminCard>
  );
}
