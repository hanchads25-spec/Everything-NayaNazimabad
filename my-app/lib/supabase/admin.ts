import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key, for uploading to
 * (and reading signed URLs from) Storage buckets. Never import this from a
 * client component — the service-role key must stay server-side.
 */

export const STORAGE_BUCKETS = {
  marketplaceImages: "marketplace-images",
  kitchenImages: "kitchen-images",
  vendorDocuments: "vendor-documents",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Image uploads aren't configured yet — add SUPABASE_SERVICE_ROLE_KEY to .env and create the storage buckets."
    );
    this.name = "StorageNotConfiguredError";
  }
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let cachedClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new StorageNotConfiguredError();
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

function extensionFromFile(file: File): string {
  const fromName = file.name?.split(".").pop();
  if (fromName && fromName.length > 0 && fromName.length <= 5) return fromName.toLowerCase();
  const fromType = file.type?.split("/").pop();
  return fromType || "bin";
}

async function uploadFile(bucket: StorageBucket, folder: string, file: File): Promise<string> {
  const client = getAdminClient();
  const ext = extensionFromFile(file);
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await client.storage.from(bucket).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;

  return path;
}

/** Uploads to a public bucket (marketplace-images, kitchen-images) and returns the public URL to store directly. */
export async function uploadPublicFile(
  bucket: Extract<StorageBucket, "marketplace-images" | "kitchen-images">,
  folder: string,
  file: File
): Promise<string> {
  const path = await uploadFile(bucket, folder, file);
  const client = getAdminClient();
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Uploads to the private vendor-documents bucket and returns the storage path (not a public URL). */
export async function uploadPrivateFile(folder: string, file: File): Promise<string> {
  return uploadFile(STORAGE_BUCKETS.vendorDocuments, folder, file);
}

/** Generates a short-lived signed URL to preview a private file (e.g. a CNIC photo) — admin use only. */
export async function createSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresInSeconds = 600
): Promise<string | null> {
  try {
    const client = getAdminClient();
    const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (error) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
