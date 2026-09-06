import { NextRequest, NextResponse } from "next/server";
import { NotificationType, TransactionStatus } from "@prisma/client";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, UnauthenticatedError } from "@/lib/session";

const ALLOWED_STATUSES: TransactionStatus[] = [
  "ACCEPTED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
];

const NOTIFICATION_COPY: Partial<
  Record<TransactionStatus, { type: NotificationType; title: (listingTitle: string) => string; body: string }>
> = {
  ACCEPTED: {
    type: "OFFER_ACCEPTED",
    title: (listingTitle) => `Your request on "${listingTitle}" was accepted`,
    body: "Head to the chat to arrange the handover.",
  },
  REJECTED: {
    type: "OFFER_REJECTED",
    title: (listingTitle) => `Your request on "${listingTitle}" was declined`,
    body: "You can send a new offer or message the seller.",
  },
  COMPLETED: {
    type: "TRANSACTION_COMPLETED",
    title: (listingTitle) => `"${listingTitle}" marked as sold`,
    body: "Thanks for using the Everything Naya Nazimabad marketplace.",
  },
  CANCELLED: {
    type: "TRANSACTION_COMPLETED",
    title: (listingTitle) => `A request on "${listingTitle}" was cancelled`,
    body: "The buyer cancelled their request.",
  },
};

/**
 * Seller accepts/rejects/completes, or buyer cancels, a Buy Now / Make Offer
 * transaction — updates listing status and notifies the other party in-app.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const currentUser = await requireCurrentUser();
    const body = await request.json().catch(() => null);
    const nextStatus = body?.status as TransactionStatus | undefined;

    if (!nextStatus || !ALLOWED_STATUSES.includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const transaction = await prisma.marketplaceTransaction.findUnique({
      where: { id },
      include: { listing: { select: { id: true, title: true, status: true } } },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const isSeller = transaction.sellerId === currentUser.id;
    const isBuyer = transaction.buyerId === currentUser.id;

    if (!isSeller && !isBuyer) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    if ((nextStatus === "ACCEPTED" || nextStatus === "REJECTED" || nextStatus === "COMPLETED") && !isSeller) {
      return NextResponse.json({ error: "Only the seller can do this." }, { status: 403 });
    }
    if (nextStatus === "CANCELLED" && !isBuyer) {
      return NextResponse.json({ error: "Only the buyer can cancel." }, { status: 403 });
    }
    if (
      transaction.status !== "PENDING" &&
      (nextStatus === "ACCEPTED" || nextStatus === "REJECTED" || nextStatus === "CANCELLED")
    ) {
      return NextResponse.json({ error: "This request was already handled." }, { status: 409 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.marketplaceTransaction.update({
        where: { id },
        data: { status: nextStatus },
      });

      if (nextStatus === "ACCEPTED") {
        await tx.marketplaceListing.update({
          where: { id: transaction.listingId },
          data: { status: "RESERVED" },
        });
      }

      if (
        (nextStatus === "REJECTED" || nextStatus === "CANCELLED") &&
        transaction.type === "BUY_NOW" &&
        transaction.listing.status === "RESERVED"
      ) {
        await tx.marketplaceListing.update({
          where: { id: transaction.listingId },
          data: { status: "AVAILABLE" },
        });
      }

      if (nextStatus === "COMPLETED") {
        await tx.marketplaceListing.update({
          where: { id: transaction.listingId },
          data: { status: "SOLD" },
        });
      }

      // A null buyerId means the buyer was a guest with no account to notify.
      const notifyUserId = isSeller ? transaction.buyerId : transaction.sellerId;
      const copy = NOTIFICATION_COPY[nextStatus];
      if (copy && notifyUserId) {
        await createNotification({
          userId: notifyUserId,
          type: copy.type,
          title: copy.title(transaction.listing.title),
          body: copy.body,
          link: transaction.conversationId ? `/messages/${transaction.conversationId}` : undefined,
          client: tx,
        });
      }

      return result;
    });

    return NextResponse.json({ transaction: updated });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
