import { NextRequest, NextResponse } from "next/server";
import { Block, ListingCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isStorageConfigured, uploadPublicFile } from "@/lib/supabase/admin";

const MAX_IMAGES = 6;

/**
 * POST /api/marketplace/listings — vendor creates a new listing, with up to
 * 6 photos uploaded to the public `marketplace-images` bucket in the same
 * request (multipart/form-data). Requires an approved vendor account.
 */
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.businessName) {
    return NextResponse.json({ error: "Register as a vendor first." }, { status: 401 });
  }
  if (!currentUser.isApproved) {
    return NextResponse.json({ error: "Your vendor account is still under review." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form submission" }, { status: 400 });
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "");
  const blockRaw = String(formData.get("block") ?? "");
  const price = Number(formData.get("price"));

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  }
  if (!Object.values(ListingCategory).includes(categoryRaw as ListingCategory)) {
    return NextResponse.json({ error: "Select a category." }, { status: 400 });
  }
  if (!Object.values(Block).includes(blockRaw as Block)) {
    return NextResponse.json({ error: "Select your block." }, { status: 400 });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
  }

  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_IMAGES);

  const imageUrls: string[] = [];
  if (files.length > 0) {
    if (!isStorageConfigured()) {
      console.warn(
        "[marketplace/listings] SUPABASE_SERVICE_ROLE_KEY not set — creating listing without photos."
      );
    } else {
      for (const file of files) {
        try {
          imageUrls.push(await uploadPublicFile("marketplace-images", `listing-${currentUser.id}`, file));
        } catch (error) {
          console.error("[marketplace/listings] image upload failed", error);
        }
      }
    }
  }

  const listing = await prisma.marketplaceListing.create({
    data: {
      sellerId: currentUser.id,
      title,
      description,
      category: categoryRaw as ListingCategory,
      price,
      block: blockRaw as Block,
      imageUrls,
      images: { create: imageUrls.map((url) => ({ url })) },
    },
  });

  return NextResponse.json({ listing }, { status: 201 });
}
