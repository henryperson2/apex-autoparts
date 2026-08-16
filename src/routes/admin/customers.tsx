import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  AdminCard,
  PanelHeader,
  SaveButton,
  TextField,
  ToggleField,
  useAdminList,
  useAdminMutations,
} from "@/components/admin/admin-kit";
import { AdminShell } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/customers")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Customers | Apex Admin" },
      { name: "description", content: "View registered customers, edit their details and disable accounts." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Customers | Apex Admin" },
      { property: "og:description", content: "Registered customer accounts." },
    ],
  }),
  component: () => (
    <AdminShell>
      <Panel />
    </AdminShell>
  ),
});

type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  is_disabled: boolean;
  created_at: string;
};

function Panel() {
  const list = useAdminList<Profile>("profiles", { orderBy: "created_at", ascending: false });
  const { update } = useAdminMutations("profiles");
  const [query, setQuery] = useState("");

  const people = (list.data ?? []).filter((person) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [person.display_name ?? "", person.email ?? "", person.phone ?? ""].some((field) =>
      field.toLowerCase().includes(needle),
    );
  });

  return (
    <>
      <PanelHeader title="Customers" description="Accounts created on the storefront." />
      <AdminCard>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or phone"
        />
        <p className="mt-3 text-xs text-muted-foreground">
          {list.isLoading ? "Loading customers…" : `${people.length} customer(s)`}
        </p>
      </AdminCard>

      {people.map((person) => (
        <CustomerCard
          key={person.id}
          person={person}
          pending={update.isPending}
          onSave={(values) => update.mutate({ id: person.id, values })}
        />
      ))}
    </>
  );
}

function CustomerCard({
  person,
  onSave,
  pending,
}: {
  person: Profile;
  onSave: (values: Record<string, unknown>) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    display_name: person.display_name ?? "",
    phone: person.phone ?? "",
    is_disabled: person.is_disabled,
  });

  return (
    <AdminCard title={person.email ?? person.id.slice(0, 8)}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Display name"
          value={form.display_name}
          onChange={(v) => setForm((p) => ({ ...p, display_name: v }))}
        />
        <TextField
          label="Phone"
          value={form.phone}
          onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
        />
        <ToggleField
          label="Account disabled"
          checked={form.is_disabled}
          onChange={(v) => setForm((p) => ({ ...p, is_disabled: v }))}
        />
        <p className="self-center text-xs text-muted-foreground">
          Joined {new Date(person.created_at).toISOString().slice(0, 10)}
        </p>
      </div>
      <div className="mt-4">
        <SaveButton
          pending={pending}
          onClick={() =>
            onSave({
              display_name: form.display_name || null,
              phone: form.phone || null,
              is_disabled: form.is_disabled,
            })
          }
        />
      </div>
    </AdminCard>
  );
}
