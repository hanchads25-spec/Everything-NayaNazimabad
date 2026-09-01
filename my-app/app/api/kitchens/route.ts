import { NextRequest, NextResponse } from "next/server";
import { CuisineType, VendorType } from "@prisma/client";

import { getPakistanNow } from "@/lib/kitchens/availability";
import { serializeKitchenSummary } from "@/lib/kitchens/serialize";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, UnauthenticatedError } from "@/lib/session";

/**
 * GET /api/kitchens — consumer discovery feed.
 *
 * Supports:
 *  - vendorType: HOME_KITCHEN | RESTAURANT
 *  - cuisine: any CuisineType — kept only if the kitchen has a menu item of
 *    that cuisine that's active right now (per the hybrid availability
 *    engine — isManualActive + schedule + stock).
 *  - q: free-text search across the kitchen name and its dish names.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorTypeParam = searchParams.get("vendorType");
  const cuisineParam = searchParams.get("cuisine");
  const query = searchParams.get("q")?.trim() ?? "";

  const vendorType =
    vendorTypeParam && vendorTypeParam in VendorType ? (vendorTypeParam as VendorType) : undefined;
  const cuisine = cuisineParam && cuisineParam in CuisineType ? (cuisineParam as CuisineType) : undefined;

  try {
    const kitchens = await prisma.kitchen.findMany({
      where: {
        ...(vendorType ? { vendorType } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { menuItems: { some: { title: { contains: query, mode: "insensitive" } } } },
              ],
            }
          : {}),
      },
      include: { menuItems: true },
      orderBy: [{ isOpen: "desc" }, { createdAt: "desc" }],
    });

    const now = getPakistanNow();
    let summaries = kitchens.map((kitchen) => serializeKitchenSummary(kitchen, now));

    if (cuisine) {
      summaries = summaries.filter((kitchen) =>
        kitchen.menuItems.some((item) => item.cuisine === cuisine && item.isActiveNow)
      );
    }

    return NextResponse.json({ kitchens: summaries });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/**
 * POST /api/kitchens — vendor onboarding: create a Kitchen owned by the
 * current (mock-session) user, used by the Vendor Management UI when a
 * user doesn't have a kitchen yet.
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireCurrentUser();
    const body = await request.json().catch(() => null);

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : undefined;
    const block = typeof body?.block === "string" ? body.block.trim() : "";
    const logoUrl = typeof body?.logoUrl === "string" && body.logoUrl.trim() ? body.logoUrl.trim() : undefined;
    const vendorType = body?.vendorType === "RESTAURANT" ? VendorType.RESTAURANT : VendorType.HOME_KITCHEN;

    if (!name) {
      return NextResponse.json({ error: "Kitchen name is required" }, { status: 400 });
    }
    if (!block) {
      return NextResponse.json({ error: "Block is required" }, { status: 400 });
    }

    const kitchen = await prisma.kitchen.create({
      data: {
        name,
        description,
        block,
        logoUrl,
        vendorType,
        ownerId: currentUser.id,
      },
    });

    return NextResponse.json({ kitchen }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
