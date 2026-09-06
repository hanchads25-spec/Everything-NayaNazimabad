import { NextRequest, NextResponse } from "next/server";
import { Block, TransactionType } from "@prisma/client";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireCurrentUser, UnauthenticatedError } from "@/lib/session";

/**
 * Raises a Buy Now (Cash on Delivery) checkout or a Make Offer proposal for
 * a listing, entirely in-app. Both are recorded as MarketplaceTransaction
 * rows and notify the seller — no external redirects.
 *
 * Guest-first browsing: Buy Now also accepts guests (no session) — they
 * supply guestName/contactPhone/deliveryAddress directly in the checkout
 * modal and buyerId is left null. Make Offer still requires sign-in, since
 * it's an ongoing negotiation tied to a chat identity.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;

  try {
    const body = await request.json().catch(() => null);
    const type: TransactionType = body?.type === "OFFER" ? "OFFER" : "BUY_NOW";

    const currentUser = type === "OFFER" ? await requireCurrentUser() : await getCurrentUser();
    const isGuest = !currentUser;

    const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (currentUser && listing.sellerId === currentUser.id) {
      return NextResponse.json({ error: "You can't buy your own listing." }, { status: 400 });
    }
    if (listing.status === "SOLD") {
      return NextResponse.json({ error: "This listing has already been sold." }, { status: 409 });
    }

    const contactPhone = typeof body?.contactPhone === "string" ? body.contactPhone.trim() : "";
    const notes = typeof body?.notes === "string" ? body.notes.trim() : undefined;
    const guestName = typeof body?.guestName === "string" ? body.guestName.trim() : "";

    if (!contactPhone) {
      return NextResponse.json({ error: "Contact phone is required" }, { status: 400 });
    }
    if (isGuest && !guestName) {
      return NextResponse.json({ error: "Your name is required" }, { status: 400 });
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

    // Guests can't chat (no session to reopen a thread with), so there's no
    // conversation for a guest Buy Now — just the transaction + a seller notification.
    const conversation = currentUser
      ? await prisma.conversation.upsert({
          where: { listingId_buyerId: { listingId, buyerId: currentUser.id } },
          update: {},
          create: { listingId, buyerId: currentUser.id, sellerId: listing.sellerId },
        })
      : null;

    const buyerLabel = currentUser?.name ?? guestName;

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.marketplaceTransaction.create({
        data: {
          listingId,
          conversationId: conversation?.id,
          buyerId: currentUser?.id,
          guestName: isGuest ? guestName : undefined,
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
            ? `${buyerLabel} made an offer on "${listing.title}"`
            : `${buyerLabel} wants to Buy Now: "${listing.title}"`,
        body:
          type === "OFFER"
            ? `Offered Rs. ${offerAmount?.toLocaleString()} — open the chat to respond.`
            : isGuest
              ? `Cash on Delivery request from a guest — contact them at ${contactPhone} to confirm.`
              : "Cash on Delivery request — open the chat to confirm details.",
        link: conversation ? `/messages/${conversation.id}` : `/marketplace/${listingId}`,
        client: tx,
      });

      return created;
    });

    return NextResponse.json(
      { transaction, conversationId: conversation?.id ?? null },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
