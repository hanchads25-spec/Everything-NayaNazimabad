"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOCKS } from "@/lib/blocks";
import { VENDOR_CATEGORY_LABELS } from "@/lib/format";

const VENDOR_CATEGORIES = Object.entries(VENDOR_CATEGORY_LABELS) as [string, string][];

export function RegisterVendorForm({
  defaultName,
  defaultPhone,
  defaultEmail,
  defaultBlock,
  defaultHouseNumber,
  defaultCategory,
}: {
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
  defaultBlock?: string;
  defaultHouseNumber?: string;
  defaultCategory?: string;
}) {
  const router = useRouter();
  const [vendorCategory, setVendorCategory] = useState(defaultCategory ?? "");
  const [block, setBlock] = useState(defaultBlock ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("vendorCategory", vendorCategory);
    formData.set("block", block);

    try {
      const response = await fetch("/api/vendor/register", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Failed to submit registration");

      toast.success("Registration submitted — you're now signed in.");

      const destination = vendorCategory === "MARKETPLACE_SELLER" ? "/marketplace/create" : "/kitchens/manage";
      router.push(destination);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="px-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" defaultValue={defaultName} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={defaultPhone}
                placeholder="03xx xxxxxxx"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" name="email" type="email" defaultValue={defaultEmail} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cnicNumber">CNIC / ID verification number</Label>
            <Input id="cnicNumber" name="cnicNumber" placeholder="xxxxx-xxxxxxx-x" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="businessName">Business / Kitchen name</Label>
            <Input
              id="businessName"
              name="businessName"
              placeholder="e.g. Ayesha's Home Kitchen"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vendorCategory">Vendor type</Label>
            <Select value={vendorCategory} onValueChange={(value) => setVendorCategory(value ?? "")} required>
              <SelectTrigger id="vendorCategory" className="w-full">
                <SelectValue placeholder="Select vendor type">
                  {(value: string) => VENDOR_CATEGORY_LABELS[value] ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {VENDOR_CATEGORIES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="block">Block</Label>
              <Select value={block} onValueChange={(value) => setBlock(value ?? "")} required>
                <SelectTrigger id="block" className="w-full">
                  <SelectValue placeholder="Select block" />
                </SelectTrigger>
                <SelectContent>
                  {BLOCKS.map((option) => (
                    <SelectItem key={option} value={option}>
                      Block {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="houseNumber">House / area</Label>
              <Input id="houseNumber" name="houseNumber" defaultValue={defaultHouseNumber} placeholder="e.g. A-12" />
            </div>
          </div>

          <ImageUploadField name="cnicImage" label="CNIC / ID photo" required />

          <p className="text-[11px] text-muted-foreground">
            Submitting registers you as a vendor and signs you in. A Naya Nazimabad admin will
            review your details before your dashboard tools unlock.
          </p>

          <Button type="submit" disabled={isSubmitting || !vendorCategory || !block} className="mt-1 w-full">
            {isSubmitting ? "Submitting…" : "Submit for review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
