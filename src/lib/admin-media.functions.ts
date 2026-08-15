import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_BYTES = 12 * 1024 * 1024;

type UploadInput = {
  fileName: string;
  mimeType: string;
  dataBase64: string;
  title?: string;
  altText?: string;
};

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
}

/** Uploads a media file to the private media bucket, exposed through /api/public/media/*. */
export const uploadMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UploadInput) => {
    if (!input || typeof input.dataBase64 !== "string" || !input.fileName || !input.mimeType) {
      throw new Error("Invalid upload payload");
    }
    if (!/^(image|video)\//.test(input.mimeType)) {
      throw new Error("Only image and video files are supported");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (roleError || !isAdmin) throw new Error("Forbidden");

    const bytes = Buffer.from(data.dataBase64, "base64");
    if (bytes.byteLength === 0) throw new Error("Empty file");
    if (bytes.byteLength > MAX_BYTES) throw new Error("File is larger than 12 MB");

    const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}-${sanitizeName(data.fileName)}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: uploadError } = await supabaseAdmin.storage
      .from("media")
      .upload(path, bytes, { contentType: data.mimeType, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data: row, error: insertError } = await supabaseAdmin
      .from("media_assets")
      .insert({
        title: data.title ?? data.fileName,
        alt_text: data.altText ?? null,
        kind: data.mimeType.startsWith("video/") ? "video" : "image",
        storage_path: path,
        url: `/api/public/media/${path}`,
        mime_type: data.mimeType,
        size_bytes: bytes.byteLength,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (insertError) throw new Error(insertError.message);

    return row;
  });

/** Deletes a media record and its stored file. */
export const deleteMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (roleError || !isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("media_assets")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();

    if (row?.storage_path) {
      await supabaseAdmin.storage.from("media").remove([row.storage_path]);
    }

    const { error } = await supabaseAdmin.from("media_assets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
