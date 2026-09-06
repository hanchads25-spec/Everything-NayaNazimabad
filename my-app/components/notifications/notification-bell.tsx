"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  // Single fetch on mount — no interval/polling. The badge reflects the
  // count as of page load; it's refreshed by a full page nav/refresh
  // (e.g. after visiting /notifications), not by a background timer.
  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/notifications");
        const data = await response.json();
        if (isMounted) setUnreadCount(data.unreadCount ?? 0);
      } catch {
        // Ignore — the badge just won't update.
      }
    }

    loadUnreadCount();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Notifications"
      className="relative shrink-0"
      nativeButton={false}
      render={<Link href="/notifications" />}
    >
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-medium text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  );
}
