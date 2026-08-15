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
import type { NavItem } from "@/lib/cms";

import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/navigation")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Navigation | Apex Admin" },
      { name: "description", content: "Manage header and footer menu labels, links, order and visibility." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Navigation | Apex Admin" },
      { property: "og:description", content: "Manage header and footer menu labels, links, order and visibility." },
    ],
  }),
  component: () => (
    <AdminShell>
      <Panel />
    </AdminShell>
  ),
});


const PROTECTED = ["/admin", "/admin/dashboard"];

function Panel() {
  const list = useAdminList<NavItem>("nav_items", { orderBy: "sort_order", ascending: true });
  const { create, update, remove } = useAdminMutations("nav_items");

  return (
    <>
      <PanelHeader
        title="Navigation"
        description="Header and footer menus on the public website."
        action={
          <Button
            variant="brass"
            onClick={() =>
              create.mutate({ location: "header", label: "New link", href: "/", sort_order: 99 })
            }
          >
            <Plus /> Add link
          </Button>
        }
      />
      {(["header", "footer"] as const).map((location) => (
        <AdminCard key={location} title={`${location} menu`}>
          <div className="space-y-3">
            {(list.data ?? [])
              .filter((item) => item.location === location)
              .map((item) => (
                <NavRow
                  key={item.id}
                  item={item}
                  onSave={(values) => update.mutate({ id: item.id, values })}
                  onDelete={() => remove.mutate(item.id)}
                  pending={update.isPending}
                />
              ))}
          </div>
        </AdminCard>
      ))}
    </>
  );
}

function NavRow({
  item,
  onSave,
  onDelete,
  pending,
}: {
  item: NavItem;
  onSave: (values: Record<string, unknown>) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    label: item.label,
    href: item.href,
    group_label: item.group_label ?? "",
    location: item.location,
    sort_order: String(item.sort_order),
    is_visible: item.is_visible,
  });
  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid gap-3 rounded border border-border p-3 md:grid-cols-6">
      <TextField label="Label" value={form.label} onChange={set("label")} />
      <TextField label="Link" value={form.href} onChange={set("href")} />
      <TextField label="Group" value={form.group_label} onChange={set("group_label")} />
      <TextField label="Location" value={form.location} onChange={set("location")} />
      <TextField label="Order" type="number" value={form.sort_order} onChange={set("sort_order")} />
      <div className="flex items-end gap-2">
        <ToggleField label="Visible" checked={form.is_visible} onChange={set("is_visible")} />
      </div>
      <div className="flex items-center gap-2 md:col-span-6">
        <SaveButton
          pending={pending}
          onClick={() => {
            if (PROTECTED.includes(form.href.trim())) return;
            onSave({
              label: form.label,
              href: form.href,
              group_label: form.group_label || null,
              location: form.location,
              sort_order: Number(form.sort_order) || 0,
              is_visible: form.is_visible,
            });
          }}
        />
        <ConfirmDelete onConfirm={onDelete} description="This menu link will be removed." />
      </div>
    </div>
  );
}
