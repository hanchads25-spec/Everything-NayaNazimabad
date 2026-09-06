"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@prisma/client";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { CUISINE_LABELS, formatPkr } from "@/lib/format";
import { describeAvailability, getPakistanNow, isMenuItemActive } from "@/lib/kitchens/availability";
import { cn } from "@/lib/utils";

export function KitchenMenu({
  kitchenId,
  kitchenIsOpen,
  menuItems,
  isSignedIn,
}: {
  kitchenId: string;
  kitchenIsOpen: boolean;
  menuItems: MenuItem[];
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recompute schedule-based availability every 30s so midnight-deal style
  // items flip on/off live without needing a page refresh.
  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // `tick` isn't read directly — bumping it just forces this render (and the
  // getPakistanNow() call below) to happen again every 30s.
  void tick;
  const now = getPakistanNow();

  const itemsById = useMemo(() => new Map(menuItems.map((item) => [item.id, item])), [menuItems]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of menuItems) {
      const list = map.get(item.cuisine) ?? [];
      list.push(item);
      map.set(item.cuisine, list);
    }
    return Array.from(map.entries());
  }, [menuItems]);

  function updateQuantity(itemId: string, delta: number) {
    setCart((current) => {
      const next = { ...current };
      const nextQty = (next[itemId] ?? 0) + delta;
      if (nextQty <= 0) delete next[itemId];
      else next[itemId] = nextQty;
      return next;
    });
  }

  function openCheckout() {
    setCheckoutOpen(true);
  }

  const cartLines = Object.entries(cart);
  const cartTotal = cartLines.reduce((sum, [id, qty]) => sum + (itemsById.get(id)?.price ?? 0) * qty, 0);
  const cartCount = cartLines.reduce((sum, [, qty]) => sum + qty, 0);

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/kitchens/${kitchenId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryAddress: String(formData.get("deliveryAddress") ?? ""),
          guestName: String(formData.get("guestName") ?? ""),
          guestPhone: String(formData.get("guestPhone") ?? ""),
          items: cartLines.map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to place order");

      toast.success("Order placed — the kitchen has been notified.");
      setCart({});
      setCheckoutOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {grouped.length === 0 && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            This kitchen hasn&apos;t added any dishes yet.
          </p>
        )}

        {grouped.map(([cuisine, items]) => (
          <section key={cuisine} className="flex flex-col gap-2">
            <h2 className="font-heading text-sm font-semibold">{CUISINE_LABELS[cuisine] ?? cuisine}</h2>
            <div className="flex flex-col gap-2">
              {items.map((item) => {
                const active = kitchenIsOpen && isMenuItemActive(item, now);
                const { statusLabel, scheduleLabel } = describeAvailability(item, now);
                const quantity = cart[item.id] ?? 0;

                return (
                  <Card key={item.id} size="sm" className={cn(!active && "opacity-60")}>
                    <CardContent className="flex items-start justify-between gap-3 px-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                        )}
                        <p className="text-sm font-semibold text-primary">{formatPkr(item.price)}</p>
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge
                            variant={active ? "default" : "secondary"}
                            className={active ? "bg-emerald-600 text-white" : ""}
                          >
                            {statusLabel}
                          </Badge>
                          {scheduleLabel && (
                            <Badge variant="outline" className="text-[10px]">
                              {scheduleLabel}
                            </Badge>
                          )}
                          {item.stockQty !== null && item.stockQty > 0 && item.stockQty <= 5 && (
                            <Badge variant="outline" className="text-[10px] text-amber-600">
                              Only {item.stockQty} left
                            </Badge>
                          )}
                        </div>
                      </div>

                      {active &&
                        (quantity > 0 ? (
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="size-3.5" />
                            </Button>
                            <span className="w-4 text-center text-sm font-medium">{quantity}</span>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button type="button" size="sm" variant="outline" onClick={() => updateQuantity(item.id, 1)}>
                            Add
                          </Button>
                        ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={openCheckout}
            className="mx-auto flex w-full max-w-md items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-4" />
              {cartCount} item{cartCount > 1 ? "s" : ""}
            </span>
            <span>{formatPkr(cartTotal)} · Checkout</span>
          </button>
        </div>
      )}

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <form onSubmit={handleCheckout} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Cash on Delivery checkout</DialogTitle>
              <DialogDescription>
                {isSignedIn
                  ? "Confirm your delivery address to place this order."
                  : "Checking out as a guest — the kitchen will contact you to confirm."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              {cartLines.map(([id, qty]) => {
                const item = itemsById.get(id);
                if (!item) return null;
                return (
                  <div key={id} className="flex items-center justify-between text-sm">
                    <span>
                      {qty} × {item.title}
                    </span>
                    <span className="font-medium">{formatPkr(item.price * qty)}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                <span>Total</span>
                <span>{formatPkr(cartTotal)}</span>
              </div>
            </div>

            {!isSignedIn && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="guestName">Your name</Label>
                  <Input id="guestName" name="guestName" placeholder="e.g. Ahmed Raza" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="guestPhone">Phone number</Label>
                  <Input id="guestPhone" name="guestPhone" type="tel" placeholder="03xx xxxxxxx" required />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deliveryAddress">Delivery address</Label>
              <Textarea
                id="deliveryAddress"
                name="deliveryAddress"
                placeholder="House/flat, street, block"
                required
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Placing order…" : "Place order (COD)"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
