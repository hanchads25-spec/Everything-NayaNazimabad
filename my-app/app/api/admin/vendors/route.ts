import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { createSignedUrl, STORAGE_BUCKETS } from "@/lib/supabase/admin";

/**
 * GET /api/admin/vendors — lists everyone who has submitted vendor
 * registration (businessName set), pending first, with a short-lived
 * signed URL to preview their CNIC photo (private bucket). Admin-only.
 */
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const vendors = await prisma.user.findMany({
    where: { businessName: { not: null } },
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
  });

  const vendorsWithSignedUrls = await Promise.all(
    vendors.map(async (vendor) => ({
      ...vendor,
      cnicSignedUrl: vendor.cnicImageUrl
        ? await createSignedUrl(STORAGE_BUCKETS.vendorDocuments, vendor.cnicImageUrl)
        : null,
    }))
  );

  return NextResponse.json({ vendors: vendorsWithSignedUrls });
}
