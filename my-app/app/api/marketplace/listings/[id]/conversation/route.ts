import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser, UnauthenticatedError } from "@/lib/session";

/**
 * Finds (or creates) the single conversation between the current user
 * (as buyer) and a listing's seller. This is the in-app replacement for
 * "Chat on WhatsApp" style buttons — everything stays inside the portal.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;

  try {
    const currentUser = await requireCurrentUser();

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId === currentUser.id) {
      return NextResponse.json(
        { error: "You can't start a chat with yourself about your own listing." },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.upsert({
      where: { listingId_buyerId: { listingId, buyerId: currentUser.id } },
      update: {},
      create: {
        listingId,
        buyerId: currentUser.id,
        sellerId: listing.sellerId,
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
