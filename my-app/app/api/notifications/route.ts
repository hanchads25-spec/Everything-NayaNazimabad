import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId, requireCurrentUser, UnauthenticatedError } from "@/lib/session";

/**
 * GET /api/notifications — fetched once on mount by <NotificationBell> to
 * read `unreadCount` for the badge (the full list is rendered server-side on
 * the /notifications page instead, via a direct Prisma call). No polling —
 * this route now sees exactly one request per page load.
 *
 * Guests (no session cookie) short-circuit before touching the database.
 * Signed-in users hit a single lean `count`, backed by the
 * `[userId, isRead]` index — no `findMany` of full rows.
 */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireCurrentUser();
    const body = await request.json().catch(() => null);

    if (body?.all) {
      await prisma.notification.updateMany({
        where: { userId: currentUser.id, isRead: false },
        data: { isRead: true },
      });
    } else if (Array.isArray(body?.ids) && body.ids.length > 0) {
      await prisma.notification.updateMany({
        where: { userId: currentUser.id, id: { in: body.ids } },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
