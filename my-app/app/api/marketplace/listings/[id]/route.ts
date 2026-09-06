import { NextRequest, NextResponse } from "next/server";
import { ListingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/** PATCH /api/marketplace/listings/[id] — seller-only status change (Available/Reserved/Sold). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.sellerId !== currentUser.id) {
    return NextResponse.json({ error: "This isn't your listing." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.status || !Object.values(ListingStatus).includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.marketplaceListing.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json({ listing: updated });
}

/** DELETE /api/marketplace/listings/[id] — seller-only. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.sellerId !== currentUser.id) {
    return NextResponse.json({ error: "This isn't your listing." }, { status: 403 });
  }

  await prisma.marketplaceListing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
