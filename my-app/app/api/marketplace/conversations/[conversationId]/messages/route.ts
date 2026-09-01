import { NextRequest, NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, UnauthenticatedError } from "@/lib/session";

async function getConversationForParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { select: { id: true, title: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  if (!conversation) return null;
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) return null;

  return conversation;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  try {
    const currentUser = await requireCurrentUser();
    const conversation = await getConversationForParticipant(conversationId, currentUser.id);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Mark the other participant's messages as read now that we're viewing them.
    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: currentUser.id }, readAt: null },
      data: { readAt: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ conversation, messages, currentUserId: currentUser.id });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  try {
    const currentUser = await requireCurrentUser();
    const conversation = await getConversationForParticipant(conversationId, currentUser.id);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const text = typeof body?.body === "string" ? body.body.trim() : "";

    if (!text) {
      return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { conversationId, senderId: currentUser.id, body: text },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const recipientId =
      conversation.buyerId === currentUser.id ? conversation.sellerId : conversation.buyerId;

    await createNotification({
      userId: recipientId,
      type: "NEW_MESSAGE",
      title: `New message from ${currentUser.name}`,
      body: text.length > 80 ? `${text.slice(0, 80)}…` : text,
      link: `/messages/${conversationId}`,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
