"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPkr, LISTING_CATEGORY_LABELS, LISTING_STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ManagedListing {
  id: string;
  title: string;
  price: string;
  category: string;
  status: string;
  imageUrl: string | null;
}

const STATUS_OPTIONS = ["AVAILABLE", "RESERVED", "SOLD"] as const;

export function ManageListings({ listings }: { listings: ManagedListing[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/marketplace/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to update listing");
      toast.success("Listing updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setPendingId(null);
    }
  }

  async function deleteListing(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this listing? This can't be undone.")) {
      return;
    }
    setPendingId(id);
    try {
      const response = await fetch(`/api/marketplace/listings/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to delete listing");
      toast.success("Listing deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button nativeButton={false} render={<Link href="/marketplace/create" />} className="w-full">
        + New listing
      </Button>

      {listings.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          You haven&apos;t listed anything yet.
        </p>
      )}

      {listings.map((listing) => (
        <Card key={listing.id}>
          <CardContent className="flex gap-3 px-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {listing.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- small thumbnail in a management list, next/image not necessary
                <img src={listing.imageUrl} alt={listing.title} className="size-16 object-cover" />
              ) : null}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-medium">{listing.title}</p>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {LISTING_CATEGORY_LABELS[listing.category] ?? listing.category}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-primary">{formatPkr(listing.price)}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={pendingId === listing.id}
                    onClick={() => updateStatus(listing.id, status)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                      listing.status === status
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    {LISTING_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete listing"
              disabled={pendingId === listing.id}
              onClick={() => deleteListing(listing.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
