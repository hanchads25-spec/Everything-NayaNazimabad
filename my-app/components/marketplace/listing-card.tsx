import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPkr, LISTING_STATUS_LABELS } from "@/lib/format";

export interface ListingCardData {
  id: string;
  title: string;
  price: string | number;
  status: string;
  block: string;
  imageUrls: string[];
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const image = listing.imageUrls[0];

  return (
    <Link href={`/marketplace/${listing.id}`} className="block h-full">
      <Card size="sm" className="h-full overflow-hidden transition-shadow hover:shadow-md active:scale-[0.98]">
        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image}
              alt={listing.title}
              fill
              sizes="(max-width: 480px) 50vw, 200px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No photo
            </div>
          )}
          {listing.status !== "AVAILABLE" && (
            <Badge variant="secondary" className="absolute left-2 top-2">
              {LISTING_STATUS_LABELS[listing.status] ?? listing.status}
            </Badge>
          )}
        </div>
        <CardContent className="flex flex-col gap-0.5 px-3">
          <p className="line-clamp-1 text-sm font-medium">{listing.title}</p>
          <p className="text-sm font-semibold text-primary">{formatPkr(listing.price)}</p>
          <p className="text-xs text-muted-foreground">Block {listing.block}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
