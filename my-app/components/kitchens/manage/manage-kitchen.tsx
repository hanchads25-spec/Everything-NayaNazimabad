"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Kitchen, MenuItem } from "@prisma/client";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MenuItemFormDialog } from "@/components/kitchens/manage/menu-item-form-dialog";
import { CUISINE_LABELS, formatPkr, VENDOR_TYPE_LABELS } from "@/lib/format";
import { describeAvailability, getPakistanNow } from "@/lib/kitchens/availability";
import { cn } from "@/lib/utils";

export function ManageKitchen({
  kitchen,
}: {
  kitchen: Kitchen & { menuItems: MenuItem[] };
}) {
  const router = useRouter();
  const [isTogglingKitchen, setIsTogglingKitchen] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; item?: MenuItem }>({ open: false });
  const now = getPakistanNow();

  async function handleMasterToggle(isOpen: boolean) {
    setIsTogglingKitchen(true);
    try {
      const response = await fetch(`/api/kitchens/${kitchen.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "Failed to update");
      toast.success(isOpen ? "Kitchen is now open" : "Kitchen is now closed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsTogglingKitchen(false);
    }
  }

  async function patchMenuItem(itemId: string, data: Record<string, unknown>, successMessage?: string) {
    setPendingItemId(itemId);
    try {
      const response = await fetch(`/api/kitchens/${kitchen.id}/menu-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "Failed to update dish");
      if (successMessage) toast.success(successMessage);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleDelete(itemId: string, title: string) {
    setPendingItemId(itemId);
    try {
      const response = await fetch(`/api/kitchens/${kitchen.id}/menu-items/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "Failed to delete dish");
      toast.success(`Removed "${title}"`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setPendingItemId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex items-center justify-between px-4">
          <div>
            <p className="text-sm font-medium">{kitchen.name}</p>
            <p className="text-xs text-muted-foreground">
              {VENDOR_TYPE_LABELS[kitchen.vendorType] ?? kitchen.vendorType} · Block {kitchen.block}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {kitchen.isOpen ? "Open" : "Closed"}
            </span>
            <Switch
              checked={kitchen.isOpen}
              disabled={isTogglingKitchen}
              onCheckedChange={handleMasterToggle}
              aria-label="Master listing toggle"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold">Menu ({kitchen.menuItems.length})</h2>
        <Button size="sm" variant="outline" onClick={() => setDialogState({ open: true })}>
          <Plus className="size-3.5" />
          Add dish
        </Button>
      </div>

      {kitchen.menuItems.length === 0 ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">No dishes yet — add your first one.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {kitchen.menuItems.map((item) => {
            const { statusLabel, scheduleLabel } = describeAvailability(item, now);
            const isPending = pendingItemId === item.id;

            return (
              <Card key={item.id} size="sm">
                <CardContent className="flex flex-col gap-2 px-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {CUISINE_LABELS[item.cuisine] ?? item.cuisine} · {formatPkr(item.price)}
                      </p>
                    </div>
                    <Switch
                      checked={item.isManualActive}
                      disabled={isPending}
                      onCheckedChange={(checked) => patchMenuItem(item.id, { isManualActive: checked })}
                      aria-label={`Toggle ${item.title}`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {statusLabel}
                    </Badge>
                    {scheduleLabel && (
                      <Badge variant="outline" className="text-[10px]">
                        {scheduleLabel}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Stock:</span>
                      {item.stockQty === null ? (
                        <span className="text-xs font-medium">Unlimited</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => patchMenuItem(item.id, { adjustStockBy: -1 })}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span
                            className={cn(
                              "w-6 text-center text-xs font-semibold",
                              item.stockQty <= 0 && "text-destructive"
                            )}
                          >
                            {item.stockQty}
                          </span>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => patchMenuItem(item.id, { adjustStockBy: 1 })}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setDialogState({ open: true, item })}
                        aria-label="Edit dish"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleDelete(item.id, item.title)}
                        aria-label="Delete dish"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MenuItemFormDialog
        kitchenId={kitchen.id}
        menuItem={dialogState.item}
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((current) => ({ ...current, open }))}
      />
    </div>
  );
}
