import Image from "next/image";
import Link from "next/link";
import { Flame, UtensilsCrossed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CUISINE_LABELS, VENDOR_TYPE_LABELS } from "@/lib/format";
import type { KitchenSummary } from "@/lib/kitchens/serialize";

export function KitchenCard({ kitchen }: { kitchen: KitchenSummary }) {
  return (
    <Link href={`/kitchens/${kitchen.id}`} className="block">
      <Card size="sm" className="overflow-hidden transition-shadow hover:shadow-md active:scale-[0.99]">
        <CardContent className="flex gap-3 px-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            {kitchen.logoUrl ? (
              <Image src={kitchen.logoUrl} alt={kitchen.name} fill sizes="64px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <UtensilsCrossed className="size-6" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-1 text-sm font-semibold">{kitchen.name}</p>
              <Badge
                variant={kitchen.isOpen ? "default" : "secondary"}
                className={kitchen.isOpen ? "bg-emerald-600 text-white" : ""}
              >
                {kitchen.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <span>{VENDOR_TYPE_LABELS[kitchen.vendorType] ?? kitchen.vendorType}</span>
              <span>·</span>
              <span>Block {kitchen.block}</span>
            </div>

            {kitchen.cuisines.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {kitchen.cuisines.slice(0, 3).map((cuisine) => (
                  <Badge key={cuisine} variant="outline" className="text-[10px]">
                    {CUISINE_LABELS[cuisine] ?? cuisine}
                  </Badge>
                ))}
              </div>
            )}

            {kitchen.todaysSpecials.length > 0 && (
              <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                <Flame className="size-3.5" />
                <span className="line-clamp-1">
                  {kitchen.todaysSpecials.map((item) => item.title).join(", ")}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
