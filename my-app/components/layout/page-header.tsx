import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  subtitle,
  backHref = "/",
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-md items-center gap-2 px-2 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          nativeButton={false}
          render={<Link href={backHref} />}
        >
          <ChevronLeft className="size-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold leading-tight">
            {title}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {action}
      </div>
    </header>
  );
}
