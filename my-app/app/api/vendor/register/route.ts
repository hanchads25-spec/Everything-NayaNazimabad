import { NextRequest, NextResponse } from "next/server";
import { Block, Prisma, Role, VendorCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { isStorageConfigured, uploadPrivateFile } from "@/lib/supabase/admin";

/**
 * POST /api/vendor/register — public (no auth required upfront). Upserts a
 * User by phone with the submitted vendor details, uploads the CNIC photo to
 * the private `vendor-documents` bucket, and signs the user in (registering
 * doubles as logging in, per the mock-session pattern in lib/session.ts).
 * `isApproved` always starts false for brand-new applicants and is never
 * reset for an existing, already-approved vendor who re-submits.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form submission" }, { status: 400 });
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const cnicNumber = String(formData.get("cnicNumber") ?? "").trim();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const vendorCategoryRaw = String(formData.get("vendorCategory") ?? "");
  const blockRaw = String(formData.get("block") ?? "");
  const houseNumber = String(formData.get("houseNumber") ?? "").trim();
  const cnicFile = formData.get("cnicImage");

  if (!name || !phone || !cnicNumber || !businessName) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  if (!Object.values(VendorCategory).includes(vendorCategoryRaw as VendorCategory)) {
    return NextResponse.json({ error: "Select a vendor type." }, { status: 400 });
  }
  if (!Object.values(Block).includes(blockRaw as Block)) {
    return NextResponse.json({ error: "Select your block." }, { status: 400 });
  }

  const vendorCategory = vendorCategoryRaw as VendorCategory;
  const block = blockRaw as Block;
  const email = emailRaw || null;

  let cnicImageUrl: string | null = null;
  if (cnicFile instanceof File && cnicFile.size > 0) {
    if (!isStorageConfigured()) {
      console.warn(
        "[vendor/register] SUPABASE_SERVICE_ROLE_KEY not set — continuing without a CNIC upload."
      );
    } else {
      try {
        cnicImageUrl = await uploadPrivateFile(`vendor-${phone.replace(/\D/g, "")}`, cnicFile);
      } catch (error) {
        console.error("[vendor/register] CNIC upload failed", error);
      }
    }
  }

  try {
    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        name,
        email,
        role: Role.VENDOR,
        businessName,
        cnicNumber,
        vendorCategory,
        block,
        houseNumber: houseNumber || null,
        ...(cnicImageUrl ? { cnicImageUrl } : {}),
      },
      create: {
        name,
        phone,
        email,
        role: Role.VENDOR,
        businessName,
        cnicNumber,
        vendorCategory,
        block,
        houseNumber: houseNumber || null,
        cnicImageUrl,
        isApproved: false,
      },
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        vendorCategory: user.vendorCategory,
        isApproved: user.isApproved,
      },
    });
    return setSessionCookie(response, user.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "That email is already used by another account." },
        { status: 409 }
      );
    }
    console.error("[vendor/register] failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
