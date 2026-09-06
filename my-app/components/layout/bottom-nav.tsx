"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChefHat,
  ClipboardList,
  Home,
  LayoutGrid,
  Plus,
  Store,
  User,
  type LucideIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Matches this route and any of its sub-routes as "active". */
  matchPrefix?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/marketplace", label: "Explore", icon: LayoutGrid, matchPrefix: true },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function isActive(item: NavItem) {
    if (item.matchPrefix) return pathname === item.href || pathname.startsWith(`${item.href}/`);
    return pathname === item.href;
  }

  const [homeItem, exploreItem, ordersItem, profileItem] = navItems;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-md items-center justify-between px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
          <NavLink item={homeItem} active={isActive(homeItem)} />
          <NavLink item={exploreItem} active={isActive(exploreItem)} />

          <button
            type="button"
            aria-label="Create"
            onClick={() => setDrawerOpen(true)}
            className="-mt-6 flex flex-col items-center gap-1"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
              <Plus className="size-6" />
            </span>
          </button>

          <NavLink item={ordersItem} active={isActive(ordersItem)} />
          <NavLink item={profileItem} active={isActive(profileItem)} />
        </div>
      </nav>

      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What would you like to do?</DialogTitle>
            <DialogDescription>Start selling or manage what you already offer.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Link
              href="/marketplace/create"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 transition-colors hover:bg-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Store className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium">Sell Marketplace Item</span>
                <span className="text-xs text-muted-foreground">List something for sale on the marketplace</span>
              </span>
            </Link>

            <Link
              href="/kitchens/manage"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 transition-colors hover:bg-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <ChefHat className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium">Manage My Kitchen</span>
                <span className="text-xs text-muted-foreground">Add dishes, set schedules, track stock</span>
              </span>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-5" />
      <span>{item.label}</span>
    </Link>
  );
}
