"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { VENDOR_TYPE_LABELS } from "@/lib/format";

export function CreateKitchenForm() {
  const router = useRouter();
  const [vendorType, setVendorType] = useState("HOME_KITCHEN");
  const [block, setBlock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/kitchens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          vendorType,
          block,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to create kitchen");

      toast.success("Kitchen created! Start adding dishes.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-1 px-4">
        <h2 className="font-heading text-base font-semibold">Set up your kitchen</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Create your Home Kitchen or Restaurant listing to start selling.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Kitchen name</Label>
            <Input id="name" name="name" placeholder="e.g. Ayesha's Home Kitchen" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vendorType">Type</Label>
            <Select value={vendorType} onValueChange={(value) => setVendorType(value ?? "HOME_KITCHEN")}>
              <SelectTrigger id="vendorType" className="w-full">
                <SelectValue>{(value: string) => VENDOR_TYPE_LABELS[value] ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOME_KITCHEN">Home Kitchen</SelectItem>
                <SelectItem value="RESTAURANT">Restaurant</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" placeholder="What do you specialize in?" />
          </div>

          <Button type="submit" disabled={isSubmitting || !block} className="mt-1 w-full">
            {isSubmitting ? "Creating…" : "Create kitchen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
