import { BottomNav } from "@/components/layout/bottom-nav";
import { PageHeader } from "@/components/layout/page-header";
import { ListingCard } from "@/components/marketplace/listing-card";
import { prisma } from "@/lib/prisma";

export default async function MarketplacePage() {
  const listings = await prisma.marketplaceListing.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title="Marketplace" subtitle="Buy & sell within Naya Nazimabad" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-28">
        {listings.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No listings yet. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  price: listing.price.toString(),
                  status: listing.status,
                  block: listing.block,
                  imageUrls: listing.imageUrls,
                }}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
