"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BLOCKS } from "@/lib/blocks";

export function BuyNowDialog({
  listingId,
  open,
  onOpenChange,
  isSignedIn,
}: {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [deliveryBlock, setDeliveryBlock] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      type: "BUY_NOW",
      deliveryBlock,
      deliveryAddress: String(formData.get("deliveryAddress") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      guestName: String(formData.get("guestName") ?? ""),
    };

    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to send request");

      onOpenChange(false);
      if (data.conversationId) {
        toast.success("Buy Now request sent — the seller has been notified.");
        router.push(`/messages/${data.conversationId}`);
        router.refresh();
      } else {
        toast.success("Order placed! The seller will contact you to confirm delivery.");
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Buy Now — Cash on Delivery</DialogTitle>
            <DialogDescription>
              {isSignedIn
                ? "Confirm your delivery details. The seller will review and confirm in chat."
                : "Confirm your details as a guest — the seller will contact you directly to confirm."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {!isSignedIn && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="guestName">Your name</Label>
                <Input id="guestName" name="guestName" placeholder="e.g. Ahmed Raza" required />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deliveryBlock">Block</Label>
              <Select
                value={deliveryBlock}
                onValueChange={(value) => setDeliveryBlock(value ?? "")}
                required
              >
                <SelectTrigger id="deliveryBlock" className="w-full">
                  <SelectValue placeholder="Select your block" />
                </SelectTrigger>
                <SelectContent>
                  {BLOCKS.map((block) => (
                    <SelectItem key={block} value={block}>
                      Block {block}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deliveryAddress">House / flat address</Label>
              <Input
                id="deliveryAddress"
                name="deliveryAddress"
                placeholder="e.g. House 12, Street 4"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                placeholder="03xx xxxxxxx"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Preferred delivery time, etc."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !deliveryBlock}>
              {isSubmitting ? "Sending…" : "Confirm Buy Now"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
