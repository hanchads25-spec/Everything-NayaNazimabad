"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VENDOR_CATEGORY_LABELS } from "@/lib/format";

export interface VendorRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  businessName: string | null;
  cnicNumber: string | null;
  vendorCategory: string | null;
  block: string | null;
  houseNumber: string | null;
  isApproved: boolean;
  cnicSignedUrl: string | null;
}

export function VendorReviewList({ vendors }: { vendors: VendorRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDecision(id: string, isApproved: boolean) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/admin/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to update vendor");

      toast.success(isApproved ? "Vendor approved" : "Vendor rejected");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setPendingId(null);
    }
  }

  if (vendors.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-muted-foreground">No vendor applications yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {vendors.map((vendor) => (
        <Card key={vendor.id}>
          <CardContent className="flex flex-col gap-2 px-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{vendor.businessName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {vendor.name} · {vendor.phone}
                </p>
              </div>
              <Badge
                variant={vendor.isApproved ? "default" : "secondary"}
                className={vendor.isApproved ? "bg-emerald-600 text-white" : ""}
              >
                {vendor.isApproved ? "Approved" : "Pending"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              <span>
                Type:{" "}
                {vendor.vendorCategory
                  ? VENDOR_CATEGORY_LABELS[vendor.vendorCategory] ?? vendor.vendorCategory
                  : "—"}
              </span>
              <span>
                Block: {vendor.block ?? "—"} {vendor.houseNumber ?? ""}
              </span>
              <span>CNIC: {vendor.cnicNumber ?? "—"}</span>
              <span className="truncate">Email: {vendor.email ?? "—"}</span>
            </div>

            {vendor.cnicSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not worth next/image config for an admin-only preview
              <img
                src={vendor.cnicSignedUrl}
                alt="CNIC"
                className="h-32 w-full rounded-lg border border-border object-cover"
              />
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
                No CNIC photo on file
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={pendingId === vendor.id}
                onClick={() => handleDecision(vendor.id, false)}
              >
                Reject
              </Button>
              <Button
                className="flex-1"
                disabled={pendingId === vendor.id || vendor.isApproved}
                onClick={() => handleDecision(vendor.id, true)}
              >
                {vendor.isApproved ? "Approved" : "Approve"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
