"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@prisma/client";
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
import { CUISINE_LABELS, SCHEDULE_TYPE_LABELS } from "@/lib/format";
import { WEEKDAY_LABELS, WEEKDAYS } from "@/lib/kitchens/availability";
import { cn } from "@/lib/utils";

const SCHEDULE_TYPES = Object.entries(SCHEDULE_TYPE_LABELS) as [string, string][];
const CUISINES = Object.entries(CUISINE_LABELS) as [string, string][];

export function MenuItemFormDialog({
  kitchenId,
  menuItem,
  open,
  onOpenChange,
}: {
  kitchenId: string;
  /** Omit to create a new dish; pass an existing item to edit it (incl. its schedule). */
  menuItem?: MenuItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        {/* Keying on the open transition + item id forces a fresh mount (and
            therefore fresh initial state from `menuItem`) every time the
            dialog is reopened, instead of resetting state in an effect. */}
        <MenuItemFormBody
          key={open ? menuItem?.id ?? "new" : "closed"}
          kitchenId={kitchenId}
          menuItem={menuItem}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function MenuItemFormBody({
  kitchenId,
  menuItem,
  onOpenChange,
}: {
  kitchenId: string;
  menuItem?: MenuItem;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const isEditing = Boolean(menuItem);

  const [cuisine, setCuisine] = useState(menuItem?.cuisine ?? "DESI");
  const [scheduleType, setScheduleType] = useState<string>(menuItem?.scheduleType ?? "PERMANENT");
  const [activeDays, setActiveDays] = useState<string[]>(menuItem?.activeDays ?? []);
  const [trackStock, setTrackStock] = useState(menuItem?.stockQty !== null && menuItem?.stockQty !== undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleDay(day: string) {
    setActiveDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    const payload: Record<string, unknown> = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: Number(formData.get("price")),
      cuisine,
      imageUrl: String(formData.get("imageUrl") ?? ""),
      scheduleType,
      activeDays: scheduleType === "RECURRING_WEEKLY" ? activeDays : [],
      specificDate: scheduleType === "SPECIFIC_DATE" ? String(formData.get("specificDate") ?? "") || null : null,
      startTime: scheduleType !== "PERMANENT" ? String(formData.get("startTime") ?? "") || null : null,
      endTime: scheduleType !== "PERMANENT" ? String(formData.get("endTime") ?? "") || null : null,
      stockQty: trackStock ? Number(formData.get("stockQty") ?? 0) : null,
    };

    try {
      const url = isEditing
        ? `/api/kitchens/${kitchenId}/menu-items/${menuItem!.id}`
        : `/api/kitchens/${kitchenId}/menu-items`;
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to save dish");

      toast.success(isEditing ? "Dish updated" : "Dish added");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit dish" : "Add a dish"}</DialogTitle>
        <DialogDescription>
          Set an alarm-style schedule — always on, specific weekdays, or a one-off date — plus an
          optional time window (e.g. 00:00–04:00 for a midnight deal).
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Dish name</Label>
          <Input id="title" name="title" defaultValue={menuItem?.title} placeholder="e.g. Chicken Biryani" required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Price (Rs.)</Label>
            <Input id="price" name="price" type="number" min="1" step="1" defaultValue={menuItem?.price} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cuisine">Cuisine</Label>
            <Select value={cuisine} onValueChange={(value) => setCuisine(value ?? "DESI")}>
                <SelectTrigger id="cuisine" className="w-full">
                  <SelectValue>{(value: string) => CUISINE_LABELS[value] ?? value}</SelectValue>
                </SelectTrigger>
              <SelectContent>
                {CUISINES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea id="description" name="description" defaultValue={menuItem?.description ?? ""} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="imageUrl">Image URL (optional)</Label>
          <Input id="imageUrl" name="imageUrl" defaultValue={menuItem?.imageUrl ?? ""} placeholder="https://…" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Schedule</Label>
          <div className="flex gap-1.5">
            {SCHEDULE_TYPES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setScheduleType(value)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                  scheduleType === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {scheduleType === "RECURRING_WEEKLY" && (
          <div className="flex flex-col gap-1.5">
            <Label>Active days</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    activeDays.includes(day)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {WEEKDAY_LABELS[day]}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Leave all unselected to repeat every day.</p>
          </div>
        )}

        {scheduleType === "SPECIFIC_DATE" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="specificDate">Date</Label>
            <Input
              id="specificDate"
              name="specificDate"
              type="date"
              defaultValue={menuItem?.specificDate ? new Date(menuItem.specificDate).toISOString().slice(0, 10) : ""}
              required
            />
          </div>
        )}

        {scheduleType !== "PERMANENT" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startTime">Start time</Label>
              <Input id="startTime" name="startTime" type="time" defaultValue={menuItem?.startTime ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endTime">End time</Label>
              <Input id="endTime" name="endTime" type="time" defaultValue={menuItem?.endTime ?? ""} />
            </div>
            <p className="col-span-2 text-[11px] text-muted-foreground">
              Leave both empty for an all-day window. e.g. 00:00 → 04:00 for a midnight deal.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Track stock</p>
            <p className="text-[11px] text-muted-foreground">Auto-hides once quantity hits 0.</p>
          </div>
          <button
            type="button"
            onClick={() => setTrackStock((value) => !value)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              trackStock
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            {trackStock ? "On" : "Off"}
          </button>
        </div>

        {trackStock && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stockQty">Quantity available</Label>
            <Input
              id="stockQty"
              name="stockQty"
              type="number"
              min="0"
              step="1"
              defaultValue={menuItem?.stockQty ?? 10}
              required
            />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Add dish"}
        </Button>
      </DialogFooter>
    </form>
  );
}
