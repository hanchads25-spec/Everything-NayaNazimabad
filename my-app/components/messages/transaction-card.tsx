"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPkr } from "@/lib/format";

export type TransactionStatusValue = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";

export interface TransactionData {
  id: string;
  type: "BUY_NOW" | "OFFER";
  status: TransactionStatusValue;
  offerAmount: string | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<
  TransactionStatusValue,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  ACCEPTED: "default",
  REJECTED: "destructive",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export function TransactionCard({
  transaction,
  isSeller,
  listingTitle,
  onStatusChange,
}: {
  transaction: TransactionData;
  isSeller: boolean;
  listingTitle: string;
  onStatusChange: (id: string, status: TransactionStatusValue) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function updateStatus(status: TransactionStatusValue) {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/marketplace/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to update");

      onStatusChange(transaction.id, status);
      toast.success(
        status === "ACCEPTED"
          ? "Accepted"
          : status === "REJECTED"
            ? "Declined"
            : status === "COMPLETED"
              ? "Marked as sold"
              : "Cancelled"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  }

  const isPending = transaction.status === "PENDING";
  const label = transaction.type === "OFFER" ? "Offer" : "Buy Now (COD)";

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2 px-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">
            {label}
            {transaction.type === "OFFER" && transaction.offerAmount && (
              <span className="text-primary"> · {formatPkr(transaction.offerAmount)}</span>
            )}
          </p>
          <Badge variant={STATUS_VARIANT[transaction.status]}>{transaction.status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">on &quot;{listingTitle}&quot;</p>

        {isSeller && isPending && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={isUpdating}
              onClick={() => updateStatus("REJECTED")}
            >
              Decline
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={isUpdating}
              onClick={() => updateStatus("ACCEPTED")}
            >
              Accept
            </Button>
          </div>
        )}

        {isSeller && transaction.status === "ACCEPTED" && (
          <Button size="sm" disabled={isUpdating} onClick={() => updateStatus("COMPLETED")}>
            Mark as completed
          </Button>
        )}

        {!isSeller && isPending && (
          <Button
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onClick={() => updateStatus("CANCELLED")}
          >
            Cancel request
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
