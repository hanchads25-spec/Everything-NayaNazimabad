import { NextRequest, NextResponse } from "next/server";
import { Block, TransactionType } from "@prisma/client";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, UnauthenticatedError } from "@/lib/session";

/**
 * Raises a Buy Now (Cash on Delivery) checkout or a Make Offer proposal for
 * a listing, entirely in-app. Both are recorded as MarketplaceTransaction
 * rows and notify the seller — no external redirects.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;

  try {
    const currentUser = await requireCurrentUser();

    const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.sellerId === currentUser.id) {
      return NextResponse.json({ error: "You can't buy your own listing." }, { status: 400 });
    }
    if (listing.status === "SOLD") {
      return NextResponse.json({ error: "This listing has already been sold." }, { status: 409 });
    }

    const body = await request.json().catch(() => null);
    const type: TransactionType = body?.type === "OFFER" ? "OFFER" : "BUY_NOW";

    const contactPhone = typeof body?.contactPhone === "string" ? body.contactPhone.trim() : "";
    const notes = typeof body?.notes === "string" ? body.notes.trim() : undefined;

    if (!contactPhone) {
      return NextResponse.json({ error: "Contact phone is required" }, { status: 400 });
    }

    let offerAmount: number | undefined;
    let deliveryBlock: Block | undefined;
    let deliveryAddress: string | undefined;

    if (type === "OFFER") {
      offerAmount = Number(body?.offerAmount);
      if (!Number.isFinite(offerAmount) || offerAmount <= 0) {
        return NextResponse.json({ error: "Enter a valid offer amount" }, { status: 400 });
      }
    } else {
      deliveryBlock = body?.deliveryBlock;
      deliveryAddress =
        typeof body?.deliveryAddress === "string" ? body.deliveryAddress.trim() : "";
      if (!deliveryBlock || !deliveryAddress) {
        return NextResponse.json(
          { error: "Delivery block and address are required for Buy Now (Cash on Delivery)." },
          { status: 400 }
        );
      }
    }

    const conversation = await prisma.conversation.upsert({
      where: { listingId_buyerId: { listingId, buyerId: currentUser.id } },
      update: {},
      create: { listingId, buyerId: currentUser.id, sellerId: listing.sellerId },
    });

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.marketplaceTransaction.create({
        data: {
          listingId,
          conversationId: conversation.id,
          buyerId: currentUser.id,
          sellerId: listing.sellerId,
          type,
          offerAmount,
          deliveryBlock,
          deliveryAddress,
          contactPhone,
          notes,
        },
      });

      if (type === "BUY_NOW" && listing.status === "AVAILABLE") {
        await tx.marketplaceListing.update({
          where: { id: listingId },
          data: { status: "RESERVED" },
        });
      }

      await createNotification({
        userId: listing.sellerId,
        type: type === "OFFER" ? "NEW_OFFER" : "BUY_NOW_REQUEST",
        title:
          type === "OFFER"
            ? `${currentUser.name} made an offer on "${listing.title}"`
            : `${currentUser.name} wants to Buy Now: "${listing.title}"`,
        body:
          type === "OFFER"
            ? `Offered Rs. ${offerAmount?.toLocaleString()} — open the chat to respond.`
            : "Cash on Delivery request — open the chat to confirm details.",
        link: `/messages/${conversation.id}`,
        client: tx,
      });

      return created;
    });

    return NextResponse.json({ transaction, conversationId: conversation.id }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
