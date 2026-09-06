import { PageHeader } from "@/components/layout/page-header";
import { ManageListings, type ManagedListing } from "@/components/marketplace/manage-listings";
import { VendorPendingScreen } from "@/components/vendor/vendor-pending-screen";
import { prisma } from "@/lib/prisma";
import { requireVendorAccess } from "@/lib/vendor-auth";

export default async function ManageListingsPage() {
  const gate = await requireVendorAccess("/auth/register-vendor?category=MARKETPLACE_SELLER");
  if (!gate.approved) {
    return <VendorPendingScreen title="My Listings" backHref="/marketplace" />;
  }

  const listings = await prisma.marketplaceListing.findMany({
    where: { sellerId: gate.user.id },
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });

  const managedListings: ManagedListing[] = listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    price: listing.price.toString(),
    category: listing.category,
    status: listing.status,
    imageUrl: listing.images[0]?.url ?? listing.imageUrls[0] ?? null,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title="My Listings" backHref="/marketplace" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-10">
        <ManageListings listings={managedListings} />
      </main>
    </div>
  );
}
