import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-only Supabase client used solely for Realtime chat broadcasts.
 * We don't use Supabase Auth — messages are persisted via our own API
 * routes (Prisma/Postgres), and this client just relays a lightweight
 * "new-message" broadcast over an ephemeral channel per conversation so
 * open chat threads update live without polling.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function conversationChannelName(conversationId: string) {
  return `conversation:${conversationId}`;
}
