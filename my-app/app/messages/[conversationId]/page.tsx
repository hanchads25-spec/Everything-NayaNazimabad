import { notFound, redirect } from "next/navigation";

import { ChatThread } from "@/components/messages/chat-thread";
import { PageHeader } from "@/components/layout/page-header";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?next=/messages/${conversationId}`);
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { select: { id: true, title: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
      transactions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (
    !conversation ||
    (conversation.buyerId !== currentUser.id && conversation.sellerId !== currentUser.id)
  ) {
    notFound();
  }

  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: currentUser.id }, readAt: null },
    data: { readAt: new Date() },
  });

  const otherParty =
    conversation.buyerId === currentUser.id ? conversation.seller : conversation.buyer;
  const isSeller = conversation.sellerId === currentUser.id;

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <PageHeader
        title={otherParty.name}
        subtitle={conversation.listing.title}
        backHref="/messages"
      />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden">
        <ChatThread
          conversationId={conversation.id}
          currentUserId={currentUser.id}
          isSeller={isSeller}
          listingTitle={conversation.listing.title}
          initialMessages={conversation.messages.map((message) => ({
            id: message.id,
            body: message.body,
            senderId: message.senderId,
            createdAt: message.createdAt.toISOString(),
          }))}
          initialTransactions={conversation.transactions.map((transaction) => ({
            id: transaction.id,
            type: transaction.type,
            status: transaction.status,
            offerAmount: transaction.offerAmount?.toString() ?? null,
            createdAt: transaction.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
