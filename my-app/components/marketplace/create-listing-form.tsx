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
import { Textarea } from "@/components/ui/textarea";
import { BLOCKS } from "@/lib/blocks";
import { LISTING_CATEGORY_LABELS } from "@/lib/format";

const CATEGORIES = Object.entries(LISTING_CATEGORY_LABELS) as [string, string][];

export function CreateListingForm() {
  const router = useRouter();
  const [category, setCategory] = useState("SECONDHAND");
  const [block, setBlock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("category", category);
    formData.set("block", block);

    try {
      const response = await fetch("/api/marketplace/listings", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Failed to create listing");

      toast.success("Listing published!");
      router.push(`/marketplace/${data.listing.id}`);
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
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. Study table with chair" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Condition, age, why you're selling…"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Price (Rs.)</Label>
              <Input id="price" name="price" type="number" min="1" step="1" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value ?? "SECONDHAND")}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue>{(value: string) => LISTING_CATEGORY_LABELS[value] ?? value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="block">Block</Label>
            <Select value={block} onValueChange={(value) => setBlock(value ?? "")} required>
              <SelectTrigger id="block" className="w-full">
                <SelectValue placeholder="Select your block" />
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

          <ImageUploadField name="images" label="Photos (up to 6)" multiple />

          <Button type="submit" disabled={isSubmitting || !block} className="mt-1 w-full">
            {isSubmitting ? "Publishing…" : "Publish listing"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
