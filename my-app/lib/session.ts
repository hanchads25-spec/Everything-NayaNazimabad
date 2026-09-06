import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * Mock session for Phase 1: there is no real login flow yet, so the
 * "signed in user" is just an id stored in a cookie, set via the
 * `/login` "Continue as" picker (seeded demo users), or via vendor
 * registration (registering doubles as signing in). Swap this out for
 * real Supabase Auth once that's wired up — every call site here goes
 * through this module so the swap is contained to one file.
 */
export const SESSION_COOKIE_NAME = "nn_uid";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Sets the session cookie on a route handler response. Shared by /api/auth/session and vendor registration. */
export function setSessionCookie<T extends NextResponse>(response: T, userId: string): T {
  response.cookies.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("You need to be signed in to do this.");
    this.name = "UnauthenticatedError";
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}
