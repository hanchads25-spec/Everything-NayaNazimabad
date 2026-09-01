import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/categories";

export function CategoryCard({ category }: { category: Category }) {
  const Icon = category.icon;

  return (
    <Link href={category.href} className="block h-full">
      <Card className="h-full transition-shadow hover:shadow-md active:scale-[0.98]">
        <CardContent className="flex h-full flex-col gap-3 px-4">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              category.accent
            )}
          >
            <Icon className="size-5" />
          </span>

          <div className="flex-1">
            <p className="font-heading text-sm font-semibold leading-snug">
              {category.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {category.description}
            </p>
          </div>

          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary">
            Explore
            <ChevronRight className="size-3.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
