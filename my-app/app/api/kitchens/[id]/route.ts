import { NextRequest, NextResponse } from "next/server";
import { VendorType } from "@prisma/client";

import { serializeKitchenDetail } from "@/lib/kitchens/serialize";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, UnauthenticatedError } from "@/lib/session";

async function getOwnedKitchenOr404(kitchenId: string, userId: string) {
  const kitchen = await prisma.kitchen.findUnique({ where: { id: kitchenId } });
  if (!kitchen) return { error: NextResponse.json({ error: "Kitchen not found" }, { status: 404 }) };
  if (kitchen.ownerId !== userId) {
    return { error: NextResponse.json({ error: "You don't manage this kitchen." }, { status: 403 }) };
  }
  return { kitchen };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const kitchen = await prisma.kitchen.findUnique({
      where: { id },
      include: { menuItems: { orderBy: { createdAt: "asc" } } },
    });

    if (!kitchen) {
      return NextResponse.json({ error: "Kitchen not found" }, { status: 404 });
    }

    return NextResponse.json({ kitchen: serializeKitchenDetail(kitchen) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/**
 * PATCH /api/kitchens/[id] — owner-only updates, including the vendor
 * management "Master Toggle" (isOpen) that one-tap enables/disables the
 * whole kitchen's listing.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const currentUser = await requireCurrentUser();
    const { kitchen, error } = await getOwnedKitchenOr404(id, currentUser.id);
    if (error) return error;

    const body = await request.json().catch(() => null);
    const data: Record<string, unknown> = {};

    if (typeof body?.isOpen === "boolean") data.isOpen = body.isOpen;
    if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body?.description === "string") data.description = body.description.trim() || null;
    if (typeof body?.block === "string" && body.block.trim()) data.block = body.block.trim();
    if (typeof body?.logoUrl === "string") data.logoUrl = body.logoUrl.trim() || null;
    if (body?.vendorType === "HOME_KITCHEN" || body?.vendorType === "RESTAURANT") {
      data.vendorType = body.vendorType as VendorType;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ kitchen });
    }

    const updated = await prisma.kitchen.update({ where: { id }, data });
    return NextResponse.json({ kitchen: updated });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
