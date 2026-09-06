import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/layout/page-header";
import { VendorReviewList, type VendorRow } from "@/components/admin/vendor-review-list";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { createSignedUrl, STORAGE_BUCKETS } from "@/lib/supabase/admin";

export default async function AdminVendorsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) {
    redirect("/");
  }

  const vendors = await prisma.user.findMany({
    where: { businessName: { not: null } },
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
  });

  const vendorRows: VendorRow[] = await Promise.all(
    vendors.map(async (vendor) => ({
      id: vendor.id,
      name: vendor.name,
      phone: vendor.phone,
      email: vendor.email,
      businessName: vendor.businessName,
      cnicNumber: vendor.cnicNumber,
      vendorCategory: vendor.vendorCategory,
      block: vendor.block,
      houseNumber: vendor.houseNumber,
      isApproved: vendor.isApproved,
      cnicSignedUrl: vendor.cnicImageUrl
        ? await createSignedUrl(STORAGE_BUCKETS.vendorDocuments, vendor.cnicImageUrl)
        : null,
    }))
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title="Vendor Approvals" subtitle={`${vendorRows.length} applicant(s)`} backHref="/profile" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-10">
        <VendorReviewList vendors={vendorRows} />
      </main>
    </div>
  );
}
