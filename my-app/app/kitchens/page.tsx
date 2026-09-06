import Link from "next/link";
import { ArrowRight, History, Sparkles } from "lucide-react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { PageHeader } from "@/components/layout/page-header";
import { DiscoveryFeed } from "@/components/kitchens/discovery-feed";
import { PlaceholderRow } from "@/components/kitchens/placeholder-row";
import { getPakistanNow } from "@/lib/kitchens/availability";
import { serializeKitchenSummary } from "@/lib/kitchens/serialize";
import { prisma } from "@/lib/prisma";

export default async function KitchensPage() {
  const kitchens = await prisma.kitchen.findMany({
    include: { menuItems: true },
    orderBy: [{ isOpen: "desc" }, { createdAt: "desc" }],
  });

  const now = getPakistanNow();
  const summaries = kitchens.map((kitchen) => serializeKitchenSummary(kitchen, now));

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title="Food & Home Kitchens" subtitle="Order from your neighborhood" />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-4 pb-28">
        <Link
          href="/kitchens/manage"
          className="flex items-center justify-between gap-2 rounded-xl bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-500/15 dark:text-orange-300"
        >
          <span>Running a Home Kitchen or Restaurant? Open Vendor Hub</span>
          <ArrowRight className="size-4 shrink-0" />
        </Link>

        <PlaceholderRow
          title="Recommended For You"
          hint="Personalized picks coming soon"
          icon={Sparkles}
        />
        <PlaceholderRow
          title="Recently Ordered"
          hint="Your order history will show up here"
          icon={History}
        />

        <DiscoveryFeed initialKitchens={summaries} />
      </main>

      <BottomNav />
    </div>
  );
}
