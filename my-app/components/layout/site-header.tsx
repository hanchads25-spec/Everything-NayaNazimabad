import { MapPin } from "lucide-react";

import { NotificationBell } from "@/components/notifications/notification-bell";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold leading-tight">
            Naya Nazimabad
          </p>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            Sector A · Karachi
          </span>
        </div>

        <NotificationBell />
      </div>
    </header>
  );
}
