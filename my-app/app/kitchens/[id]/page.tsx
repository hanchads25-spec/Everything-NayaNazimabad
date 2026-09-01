import Image from "next/image";
import { notFound } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { KitchenMenu } from "@/components/kitchens/kitchen-menu";
import { Badge } from "@/components/ui/badge";
import { VENDOR_TYPE_LABELS } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function KitchenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [kitchen, currentUser] = await Promise.all([
    prisma.kitchen.findUnique({
      where: { id },
      include: { menuItems: { orderBy: { createdAt: "asc" } } },
    }),
    getCurrentUser(),
  ]);

  if (!kitchen) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 pb-32">
      <PageHeader title={kitchen.name} backHref="/kitchens" />

      <main className="mx-auto w-full max-w-md flex-1">
        <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted">
            {kitchen.logoUrl ? (
              <Image src={kitchen.logoUrl} alt={kitchen.name} fill sizes="56px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <UtensilsCrossed className="size-6" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-heading text-base font-semibold">{kitchen.name}</h1>
              <Badge
                variant={kitchen.isOpen ? "default" : "secondary"}
                className={kitchen.isOpen ? "bg-emerald-600 text-white" : ""}
              >
                {kitchen.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {VENDOR_TYPE_LABELS[kitchen.vendorType] ?? kitchen.vendorType} · Block {kitchen.block}
            </p>
            {kitchen.description && (
              <p className="text-xs leading-relaxed text-foreground/80">{kitchen.description}</p>
            )}
          </div>
        </div>

        <div className="px-4 py-4">
          <KitchenMenu
            kitchenId={kitchen.id}
            kitchenIsOpen={kitchen.isOpen}
            menuItems={kitchen.menuItems}
            isSignedIn={Boolean(currentUser)}
          />
        </div>
      </main>
    </div>
  );
}
