import { useEffect, useState } from "react";

import {
  AdminCard,
  PanelHeader,
  SaveButton,
  useAdminList,
  useAdminMutations,
} from "@/components/admin/admin-kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSetting } from "@/lib/cms";

import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings | Apex Admin" },
      { name: "description", content: "Business information, SEO, social links, footer and store settings." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Settings | Apex Admin" },
      { property: "og:description", content: "Business information, SEO, social links, footer and store settings." },
    ],
  }),
  component: () => (
    <AdminShell>
      <Panel />
    </AdminShell>
  ),
});


const GROUP_TITLES: Record<string, string> = {
  general: "Website identity",
  seo: "SEO & metadata",
  contact: "Contact / business information",
  social: "Social media links",
  footer: "Footer & newsletter",
  store: "Store settings",
};

function Panel() {
  const list = useAdminList<SiteSetting>("site_settings", { orderBy: "sort_order", ascending: true });
  const { update } = useAdminMutations("site_settings", "key");
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!list.data) return;
    setDraft(Object.fromEntries(list.data.map((row) => [row.key, row.value ?? ""])));
  }, [list.data]);

  const groups = Array.from(new Set((list.data ?? []).map((row) => row.group_name)));

  return (
    <>
      <PanelHeader title="Settings" description="These values feed the public website directly." />
      {groups.map((group) => (
        <AdminCard key={group} title={GROUP_TITLES[group] ?? group}>
          <div className="grid gap-4 md:grid-cols-2">
            {(list.data ?? [])
              .filter((row) => row.group_name === group)
              .map((row) => (
                <div key={row.key}>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    {row.label}
                  </Label>
                  <div className="mt-1.5 flex gap-2">
                    {row.input_type === "textarea" ? (
                      <Textarea
                        rows={3}
                        value={draft[row.key] ?? ""}
                        onChange={(e) => setDraft((p) => ({ ...p, [row.key]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        type={row.input_type === "number" ? "number" : "text"}
                        value={draft[row.key] ?? ""}
                        onChange={(e) => setDraft((p) => ({ ...p, [row.key]: e.target.value }))}
                      />
                    )}
                  </div>
                  <div className="mt-2">
                    <SaveButton
                      pending={update.isPending}
                      onClick={() =>
                        update.mutate({ id: row.key, values: { value: draft[row.key] ?? "" } })
                      }
                    />
                  </div>
                </div>
              ))}
          </div>
        </AdminCard>
      ))}
    </>
  );
}
