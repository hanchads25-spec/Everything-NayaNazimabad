import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

import { getCurrentUser } from "@/lib/session";

/**
 * Vendor authorization gate, used by every vendor-tool page
 * (/marketplace/create, /marketplace/manage, /kitchens/manage):
 *
 * - No session, or a session that never submitted vendor registration
 *   (`businessName` is null) -> redirect to /auth/register-vendor.
 * - Registered but not yet approved -> caller renders <VendorPendingScreen>.
 * - Approved -> caller renders the real page content.
 *
 * `businessName != null` doubles as "has applied to be a vendor" so we don't
 * need a separate application-status enum.
 */
export async function requireVendorAccess(
  registerHref = "/auth/register-vendor"
): Promise<{ approved: true; user: User } | { approved: false }> {
  const user = await getCurrentUser();

  if (!user || !user.businessName) {
    redirect(registerHref);
  }

  if (!user.isApproved) {
    return { approved: false };
  }

  return { approved: true, user };
}
