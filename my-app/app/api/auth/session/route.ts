import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const userId = body?.userId;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const response = NextResponse.json({ user: { id: user.id, name: user.name } });
  return setSessionCookie(response, user.id);
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
