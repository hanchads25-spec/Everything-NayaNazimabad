import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * One-off setup script: creates the Supabase Storage buckets this app needs.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (Project Settings -> API ->
 * service_role secret). Safe to re-run; skips buckets that already exist.
 *
 * Usage: node scripts/setup-storage-buckets.mjs
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env — add SUPABASE_SERVICE_ROLE_KEY and re-run."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const buckets = [
  { id: "marketplace-images", public: true },
  { id: "kitchen-images", public: true },
  { id: "vendor-documents", public: false },
];

async function main() {
  const { data: existing, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Failed to list buckets:", listError.message);
    process.exit(1);
  }
  const existingIds = new Set((existing ?? []).map((bucket) => bucket.id));

  for (const bucket of buckets) {
    if (existingIds.has(bucket.id)) {
      console.log(`- ${bucket.id}: already exists, skipping`);
      continue;
    }

    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: "5MB",
    });

    if (error) {
      console.error(`- ${bucket.id}: failed to create — ${error.message}`);
    } else {
      console.log(`- ${bucket.id}: created (${bucket.public ? "public" : "private"})`);
    }
  }
}

main();
