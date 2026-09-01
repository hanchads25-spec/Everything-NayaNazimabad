import Link from "next/link";
import { redirect } from "next/navigation";

import { BottomNav } from "@/components/layout/bottom-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function MessagesInboxPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/messages");
  }

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: currentUser.id }, { sellerId: currentUser.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { select: { id: true, title: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const unreadCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversations.map((conversation) => conversation.id) },
      senderId: { not: currentUser.id },
      readAt: null,
    },
    _count: { _all: true },
  });
  const unreadMap = new Map(unreadCounts.map((row) => [row.conversationId, row._count._all]));

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title="Messages" subtitle="Chats with buyers & sellers" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-28">
        {conversations.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No conversations yet — start one from a listing&apos;s &quot;Chat with Seller&quot;
            button.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map((conversation) => {
              const otherParty =
                conversation.buyerId === currentUser.id ? conversation.seller : conversation.buyer;
              const lastMessage = conversation.messages[0];
              const unread = unreadMap.get(conversation.id) ?? 0;

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                >
                  <Avatar>
                    <AvatarFallback>{otherParty.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{otherParty.name}</p>
                      {unread > 0 && (
                        <Badge className="shrink-0 px-1.5 text-[10px]">{unread}</Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {conversation.listing.title}
                    </p>
                    {lastMessage && (
                      <p className="truncate text-xs text-muted-foreground">{lastMessage.body}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
