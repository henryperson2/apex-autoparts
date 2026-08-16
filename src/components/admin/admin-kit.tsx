import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { uploadMediaAsset } from "@/lib/admin-media.functions";
import type { MediaAsset } from "@/lib/cms";
import { cn } from "@/lib/utils";

/* ---------- layout primitives ---------- */

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
      <div>
        <h1 className="text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({
  children,
  className,
  title,
  toolbar,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  toolbar?: ReactNode;
}) {
  return (
    <section className={cn("rounded-md border border-border bg-card p-4 sm:p-5", className)}>
      {(title || toolbar) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="label-stencil text-base">{title}</h2>}
          {toolbar}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string | undefined;
}) {
  return (
    <div className="min-w-0">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string | undefined;
  hint?: string | undefined;
}) {
  return (
    <Field label={label} {...(hint ? { hint } : {})}>
      <Input
        type={type}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function AreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <Field label={label}>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded border border-border px-3 py-2">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span className="text-sm">{label}</span>
    </label>
  );
}

export function ConfirmDelete({
  onConfirm,
  label = "Delete",
  description = "This cannot be undone.",
  trigger,
}: {
  onConfirm: () => void;
  label?: string;
  description?: string;
  trigger?: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="text-destructive">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">{label}</span>
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SaveButton({ onClick, pending }: { onClick: () => void; pending?: boolean }) {
  return (
    <Button variant="brass" onClick={onClick} disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      Save
    </Button>
  );
}

/* ---------- generic table CRUD ---------- */

type TableName =
  | "products"
  | "categories"
  | "homepage_sections"
  | "testimonials"
  | "pages"
  | "page_sections"
  | "nav_items"
  | "site_settings"
  | "media_assets"
  | "newsletter_subscribers"
  | "contact_messages"
  | "orders"
  | "profiles";

export function useAdminList<T>(
  table: TableName,
  options?: { select?: string; orderBy?: string; ascending?: boolean; extraKey?: string },
) {
  const select = options?.select ?? "*";
  const orderBy = options?.orderBy ?? "created_at";
  const ascending = options?.ascending ?? false;

  return useQuery({
    queryKey: ["admin", table, options?.extraKey ?? select],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .order(orderBy, { ascending });
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });
}

export function useAdminMutations(table: TableName, keyColumn: "id" | "key" = "id") {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", table] });
    queryClient.invalidateQueries();
  };

  const create = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(table) as any).insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Created and saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(table) as any).update(values).eq(keyColumn, id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(table) as any).delete().eq(keyColumn, id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Deleted.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { create, update, remove };
}

/* ---------- media ---------- */

export function useMediaAssets() {
  return useQuery({
    queryKey: ["admin", "media_assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaAsset[];
    },
  });
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function useMediaUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const dataBase64 = await fileToBase64(file);
      return uploadMediaAsset({
        data: { fileName: file.name, mimeType: file.type, dataBase64, title: file.name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media_assets"] });
      toast.success("Upload complete.");
    },
    onError: (error: Error) => toast.error(error.message || "Upload failed"),
  });
}

export function UploadButton({
  onUploaded,
  label = "Upload media",
}: {
  onUploaded?: (asset: MediaAsset) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload();

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          const asset = await upload.mutateAsync(file).catch(() => null);
          if (asset && onUploaded) onUploaded(asset as MediaAsset);
        }}
      />
      <Button
        type="button"
        variant="brass"
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
      >
        {upload.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
        {label}
      </Button>
    </>
  );
}

/** Text input for a media URL plus a picker/upload shortcut. */
export function MediaField({
  label,
  value,
  onChange,
  kind = "image",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: "image" | "video";
}) {
  const media = useMediaAssets();
  const [picking, setPicking] = useState(false);
  const options = (media.data ?? []).filter((asset) => asset.kind === kind);

  return (
    <Field label={label}>
      <div className="flex flex-wrap items-center gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/api/public/media/..." />
        <Button type="button" variant="outline" size="sm" onClick={() => setPicking((v) => !v)}>
          Library
        </Button>
        <UploadButton label="Upload" onUploaded={(asset) => onChange(asset.url)} />
      </div>
      {picking && (
        <div className="mt-2 grid max-h-52 grid-cols-3 gap-2 overflow-y-auto rounded border border-border p-2 sm:grid-cols-5">
          {options.length === 0 && (
            <p className="col-span-full text-xs text-muted-foreground">Library is empty.</p>
          )}
          {options.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => {
                onChange(asset.url);
                setPicking(false);
              }}
              className="overflow-hidden rounded border border-border hover:border-brass"
            >
              {asset.kind === "image" ? (
                <img src={asset.url} alt={asset.alt_text ?? ""} className="h-16 w-full object-cover" />
              ) : (
                <span className="block truncate p-2 text-[10px]">{asset.title}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {value && kind === "image" && (
        <img src={value} alt="" className="mt-2 h-20 rounded border border-border object-cover" />
      )}
    </Field>
  );
}

/* ---------- select ---------- */

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string | undefined;
}) {
  return (
    <Field label={label} {...(hint ? { hint } : {})}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
