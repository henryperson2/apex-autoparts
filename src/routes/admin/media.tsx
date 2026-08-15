import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AdminCard,
  ConfirmDelete,
  PanelHeader,
  SaveButton,
  TextField,
  UploadButton,
  useAdminMutations,
  useMediaAssets,
} from "@/components/admin/admin-kit";
import { deleteMediaAsset } from "@/lib/admin-media.functions";
import type { MediaAsset } from "@/lib/cms";

import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/media")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Media | Apex Admin" },
      { name: "description", content: "Upload, edit and delete website images and videos." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Media | Apex Admin" },
      { property: "og:description", content: "Upload, edit and delete website images and videos." },
    ],
  }),
  component: () => (
    <AdminShell>
      <Panel />
    </AdminShell>
  ),
});


function Panel() {
  const media = useMediaAssets();
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => deleteMediaAsset({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Deleted.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PanelHeader
        title="Media library"
        description="Images and videos used across the website. Max 12 MB per file."
        action={<UploadButton />}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(media.data ?? []).map((asset) => (
          <MediaCard key={asset.id} asset={asset} onDelete={() => remove.mutate(asset.id)} />
        ))}
        {(media.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing uploaded yet.</p>
        )}
      </div>
    </>
  );
}

function MediaCard({ asset, onDelete }: { asset: MediaAsset; onDelete: () => void }) {
  const { update } = useAdminMutations("media_assets");
  const [form, setForm] = useState({
    title: asset.title ?? "",
    alt_text: asset.alt_text ?? "",
    sort_order: String(asset.sort_order),
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AdminCard>
      {asset.kind === "image" ? (
        <img src={asset.url} alt={asset.alt_text ?? ""} className="h-40 w-full rounded object-cover" />
      ) : (
        <video src={asset.url} controls className="h-40 w-full rounded object-cover" />
      )}
      <div className="mt-3 space-y-3">
        <TextField label="Title" value={form.title} onChange={set("title")} />
        <TextField label="Alt text" value={form.alt_text} onChange={set("alt_text")} />
        <TextField label="Order" type="number" value={form.sort_order} onChange={set("sort_order")} />
        <p className="break-all text-xs text-muted-foreground">{asset.url}</p>
        <div className="flex items-center gap-2">
          <SaveButton
            pending={update.isPending}
            onClick={() =>
              update.mutate({
                id: asset.id,
                values: {
                  title: form.title || null,
                  alt_text: form.alt_text || null,
                  sort_order: Number(form.sort_order) || 0,
                },
              })
            }
          />
          <ConfirmDelete onConfirm={onDelete} description="The file and its record will be deleted." />
        </div>
      </div>
    </AdminCard>
  );
}
