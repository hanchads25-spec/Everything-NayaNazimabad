import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/**
 * "Chat with Seller" entry point — finds or creates the in-app conversation
 * for this listing + buyer, then hands off to the shared chat thread UI.
 * No external redirects (WhatsApp/Facebook) are ever used here.
 */
export default async function ListingChatRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: listingId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?next=/marketplace/${listingId}/chat`);
  }

  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true },
  });

  if (!listing) {
    redirect("/marketplace");
  }

  if (listing.sellerId === currentUser.id) {
    redirect(`/marketplace/${listingId}`);
  }

  const conversation = await prisma.conversation.upsert({
    where: { listingId_buyerId: { listingId, buyerId: currentUser.id } },
    update: {},
    create: { listingId, buyerId: currentUser.id, sellerId: listing.sellerId },
  });

  redirect(`/messages/${conversation.id}`);
}
