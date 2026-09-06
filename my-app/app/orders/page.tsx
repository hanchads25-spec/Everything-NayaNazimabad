import Link from "next/link";
import { ChefHat, ShoppingBag } from "lucide-react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FOOD_ORDER_STATUS_LABELS,
  formatPkr,
  TRANSACTION_STATUS_LABELS,
} from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function OrdersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <PageHeader title="Orders" />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Sign in to see your order history. If you just placed an order as a guest, the seller
            already has your contact details and will reach out directly.
          </p>
          <Button nativeButton={false} render={<Link href="/login?next=/orders" />}>
            Continue as a demo resident
          </Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const [foodOrders, transactions] = await Promise.all([
    prisma.foodOrder.findMany({
      where: { buyerId: currentUser.id },
      include: { kitchen: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.marketplaceTransaction.findMany({
      where: { buyerId: currentUser.id },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  type OrderRow =
    | { kind: "food"; id: string; createdAt: Date; title: string; detail: string; amount: string; status: string; href: string }
    | { kind: "transaction"; id: string; createdAt: Date; title: string; detail: string; amount: string; status: string; href: string };

  const foodRows: OrderRow[] = foodOrders.map((order) => {
    const items = Array.isArray(order.items) ? (order.items as { title: string; quantity: number }[]) : [];
    return {
      kind: "food",
      id: order.id,
      createdAt: order.createdAt,
      title: order.kitchen.name,
      detail: items.map((item) => `${item.quantity}× ${item.title}`).join(", "),
      amount: formatPkr(order.totalAmount),
      status: FOOD_ORDER_STATUS_LABELS[order.status] ?? order.status,
      href: `/kitchens/${order.kitchenId}`,
    };
  });

  const transactionRows: OrderRow[] = transactions.map((transaction) => ({
    kind: "transaction",
    id: transaction.id,
    createdAt: transaction.createdAt,
    title: transaction.listing.title,
    detail: transaction.type === "OFFER" ? "Offer" : "Buy Now (COD)",
    amount: formatPkr((transaction.offerAmount ?? transaction.listing.price).toString()),
    status: TRANSACTION_STATUS_LABELS[transaction.status] ?? transaction.status,
    href: `/marketplace/${transaction.listingId}`,
  }));

  const rows = [...foodRows, ...transactionRows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title="Orders" subtitle="Your food & marketplace orders" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-28">
        {rows.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <Link key={`${row.kind}-${row.id}`} href={row.href}>
                <Card size="sm">
                  <CardContent className="flex items-start gap-3 px-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {row.kind === "food" ? (
                        <ChefHat className="size-4" />
                      ) : (
                        <ShoppingBag className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium">{row.title}</p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {row.status}
                        </Badge>
                      </div>
                      {row.detail && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.detail}</p>
                      )}
                      <p className="mt-0.5 text-sm font-semibold text-primary">{row.amount}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
