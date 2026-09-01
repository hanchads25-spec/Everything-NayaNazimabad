"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RealtimeChannel } from "@supabase/realtime-js";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TransactionCard,
  type TransactionData,
  type TransactionStatusValue,
} from "@/components/messages/transaction-card";
import { conversationChannelName, createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface MessageData {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

export function ChatThread({
  conversationId,
  currentUserId,
  isSeller,
  initialMessages,
  initialTransactions,
  listingTitle,
}: {
  conversationId: string;
  currentUserId: string;
  isSeller: boolean;
  initialMessages: MessageData[];
  initialTransactions: TransactionData[];
  listingTitle: string;
}) {
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [transactions, setTransactions] = useState<TransactionData[]>(initialTransactions);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Live updates via a Supabase Realtime broadcast channel scoped to this
  // conversation — no polling, no DB replication/RLS setup required.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(conversationChannelName(conversationId));

    channel
      .on("broadcast", { event: "new-message" }, (payload) => {
        const incoming = payload.payload as MessageData;
        if (incoming.senderId === currentUserId) return;
        setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleTransactionStatusChange(id: string, status: TransactionStatusValue) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setDraft("");

    try {
      const response = await fetch(`/api/marketplace/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to send message");

      const message: MessageData = {
        id: data.message.id,
        body: data.message.body,
        senderId: data.message.senderId,
        createdAt: data.message.createdAt,
      };

      setMessages((prev) => [...prev, message]);
      channelRef.current?.send({ type: "broadcast", event: "new-message", payload: message });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setDraft(text);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {transactions.length > 0 && (
          <div className="flex flex-col gap-2">
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                isSeller={isSeller}
                listingTitle={listingTitle}
                onStatusChange={handleTransactionStatusChange}
              />
            ))}
          </div>
        )}

        {messages.length === 0 && transactions.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Say hello — all messages stay inside the app.
          </p>
        )}

        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId;
          return (
            <div key={message.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground ring-1 ring-foreground/10"
                )}
              >
                {message.body}
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border bg-background px-3 py-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message…"
          disabled={isSending}
          className="h-10"
        />
        <Button type="submit" size="icon" disabled={isSending || !draft.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
