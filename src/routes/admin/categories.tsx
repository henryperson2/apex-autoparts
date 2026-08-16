import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

import {
  AdminCard,
  AreaField,
  ConfirmDelete,
  PanelHeader,
  SaveButton,
  TextField,
  useAdminList,
  useAdminMutations,
} from "@/components/admin/admin-kit";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import type { Category } from "@/lib/store";

export const Route = createFileRoute("/admin/categories")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Categories | Apex Admin" },
      { name: "description", content: "Create and edit the catalog departments shown on the website." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Categories | Apex Admin" },
      { property: "og:description", content: "Manage catalog departments." },
    ],
  }),
  component: () => (
    <AdminShell>
      <Panel />
    </AdminShell>
  ),
});

function Panel() {
  const list = useAdminList<Category>("categories", { orderBy: "sort_order", ascending: true });
  const { create, update, remove } = useAdminMutations("categories");

  return (
    <>
      <PanelHeader
        title="Categories"
        description="Departments customers browse on the homepage and catalog."
        action={
          <Button
            variant="brass"
            onClick={() =>
              create.mutate({
                name: "New department",
                slug: `department-${Date.now().toString().slice(-5)}`,
                sort_order: (list.data?.length ?? 0) + 1,
              })
            }
          >
            <Plus /> Add category
          </Button>
        }
      />
      {(list.data ?? []).map((item) => (
        <CategoryEditor
          key={item.id}
          item={item}
          pending={update.isPending}
          onSave={(values) => update.mutate({ id: item.id, values })}
          onDelete={() => remove.mutate(item.id)}
        />
      ))}
    </>
  );
}

function CategoryEditor({
  item,
  onSave,
  onDelete,
  pending,
}: {
  item: Category;
  onSave: (values: Record<string, unknown>) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    name: item.name,
    slug: item.slug,
    description: item.description ?? "",
    icon: item.icon ?? "",
    sort_order: String(item.sort_order),
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AdminCard title={item.name}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Name" value={form.name} onChange={set("name")} />
        <TextField label="URL slug" value={form.slug} onChange={set("slug")} />
        <TextField label="Icon name" value={form.icon} onChange={set("icon")} />
        <TextField label="Order" type="number" value={form.sort_order} onChange={set("sort_order")} />
        <div className="md:col-span-2">
          <AreaField label="Description" value={form.description} onChange={set("description")} rows={2} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <SaveButton
          pending={pending}
          onClick={() =>
            onSave({
              name: form.name,
              slug: form.slug,
              description: form.description || null,
              icon: form.icon || null,
              sort_order: Number(form.sort_order) || 0,
            })
          }
        />
        <ConfirmDelete
          onConfirm={onDelete}
          description="Products in this category will keep existing but lose their department."
        />
      </div>
    </AdminCard>
  );
}
