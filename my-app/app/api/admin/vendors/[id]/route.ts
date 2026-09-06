import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/**
 * PATCH /api/admin/vendors/[id] — approve or reject a pending vendor.
 * Admin-only. Notifies the vendor either way.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.isApproved !== "boolean") {
    return NextResponse.json({ error: "isApproved must be a boolean" }, { status: 400 });
  }

  const vendor = await prisma.user.update({
    where: { id },
    data: { isApproved: body.isApproved },
  });

  await createNotification({
    userId: vendor.id,
    type: body.isApproved ? "VENDOR_APPROVED" : "VENDOR_REJECTED",
    title: body.isApproved ? "Your vendor account has been approved!" : "Your vendor application was rejected",
    body: body.isApproved
      ? "You can now access your vendor dashboard tools from your Profile."
      : "Contact the Naya Nazimabad admin for more details.",
    link: "/profile",
  });

  return NextResponse.json({ vendor });
}
