/**
 * Storage adapter backed by Lovable Cloud storage.
 */
import { getDb } from "@/lib/db/client.server";
import type { StorageProvider } from "@/lib/providers/types";

export const STUDIO_BUCKET = "studio-assets";

export const cloudStorageProvider: StorageProvider = {
  kind: "STORAGE",
  name: "supabase",
  isConfigured: () => true,
  async put({ path, body, contentType }) {
    const startedAt = Date.now();
    const { error } = await getDb()
      .storage.from(STUDIO_BUCKET)
      .upload(path, body as Blob, {
        upsert: true,
        ...(contentType ? { contentType } : {}),
      });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return {
      data: { path },
      usage: { units: 0, unitType: "bytes", latencyMs: Date.now() - startedAt },
      providerName: "supabase",
    };
  },
  async signedUrl(path, expiresInSeconds = 3600) {
    const startedAt = Date.now();
    const { data, error } = await getDb()
      .storage.from(STUDIO_BUCKET)
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data) throw new Error(`Signed URL failed: ${error?.message ?? "unknown error"}`);
    return {
      data: { url: data.signedUrl },
      usage: { units: 0, unitType: "bytes", latencyMs: Date.now() - startedAt },
      providerName: "supabase",
    };
  },
};
