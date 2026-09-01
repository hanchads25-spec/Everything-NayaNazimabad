import Image from "next/image";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ListingActions } from "@/components/marketplace/listing-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatPkr,
  LISTING_CATEGORY_LABELS,
  LISTING_STATUS_LABELS,
} from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [listing, currentUser] = await Promise.all([
    prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        images: true,
        seller: { select: { id: true, name: true, block: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!listing) {
    notFound();
  }

  const images = listing.images.length > 0 ? listing.images.map((image) => image.url) : listing.imageUrls;
  const isOwnListing = currentUser?.id === listing.sellerId;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 pb-32">
      <PageHeader title={listing.title} backHref="/marketplace" />

      <main className="mx-auto w-full max-w-md flex-1">
        <div className="relative aspect-4/3 w-full bg-muted">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={listing.title}
              fill
              sizes="480px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No photo available
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {LISTING_CATEGORY_LABELS[listing.category] ?? listing.category}
              </Badge>
              {listing.status !== "AVAILABLE" && (
                <Badge variant="secondary">
                  {LISTING_STATUS_LABELS[listing.status] ?? listing.status}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 font-heading text-lg font-semibold leading-snug">
              {listing.title}
            </h1>
            <p className="mt-0.5 text-xl font-semibold text-primary">
              {formatPkr(listing.price.toString())}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Block {listing.block}</p>
          </div>

          <p className="text-sm leading-relaxed text-foreground/90">{listing.description}</p>

          <Card size="sm">
            <CardContent className="flex items-center gap-3 px-3">
              <Avatar>
                <AvatarFallback>{listing.seller.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{listing.seller.name}</p>
                <p className="text-xs text-muted-foreground">
                  Block {listing.seller.block ?? "—"} · Seller
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <ListingActions
            listingId={listing.id}
            listingStatus={listing.status}
            isOwnListing={isOwnListing}
            isSignedIn={Boolean(currentUser)}
          />
        </div>
      </div>
    </div>
  );
}
