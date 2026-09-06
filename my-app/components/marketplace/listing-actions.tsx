"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ShoppingBag, Tag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BuyNowDialog } from "@/components/marketplace/buy-now-dialog";
import { MakeOfferDialog } from "@/components/marketplace/make-offer-dialog";

export function ListingActions({
  listingId,
  listingStatus,
  isOwnListing,
  isSignedIn,
}: {
  listingId: string;
  listingStatus: string;
  isOwnListing: boolean;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

  if (isOwnListing) {
    return (
      <p className="rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        This is your listing — buyers can chat and make offers here.
      </p>
    );
  }

  function requireSignIn() {
    if (!isSignedIn) {
      toast.error("Continue as a demo resident first.");
      router.push(`/login?next=/marketplace/${listingId}`);
      return false;
    }
    return true;
  }

  async function handleChat() {
    if (!requireSignIn()) return;
    setIsChatLoading(true);
    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}/conversation`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to start chat");
      router.push(`/messages/${data.conversation.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setIsChatLoading(false);
    }
  }

  const isSold = listingStatus === "SOLD";

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleChat}
        disabled={isChatLoading || isSold}
      >
        <MessageCircle className="size-4" />
        {isChatLoading ? "Opening chat…" : "Chat with Seller"}
      </Button>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={isSold}
          onClick={() => requireSignIn() && setOfferOpen(true)}
        >
          <Tag className="size-4" />
          Make Offer
        </Button>
        <Button className="flex-1" disabled={isSold} onClick={() => setBuyNowOpen(true)}>
          <ShoppingBag className="size-4" />
          Buy Now
        </Button>
      </div>

      {!isSignedIn && (
        <p className="text-center text-[11px] text-muted-foreground">
          Buy Now works as a guest — Make Offer &amp; Chat need you to continue as a demo resident.
        </p>
      )}

      <BuyNowDialog
        listingId={listingId}
        open={buyNowOpen}
        onOpenChange={setBuyNowOpen}
        isSignedIn={isSignedIn}
      />
      <MakeOfferDialog listingId={listingId} open={offerOpen} onOpenChange={setOfferOpen} />
    </div>
  );
}
