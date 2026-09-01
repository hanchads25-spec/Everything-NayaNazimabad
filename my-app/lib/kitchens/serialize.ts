import type { Kitchen, MenuItem } from "@prisma/client";

import { describeAvailability, getPakistanNow, isMenuItemActive, type PakistanNow } from "@/lib/kitchens/availability";

export type MenuItemWithComputed = MenuItem & {
  isActiveNow: boolean;
  isSpecial: boolean;
  scheduleLabel: string | null;
  statusLabel: string;
  countdownSeconds: number | null;
};

export function serializeMenuItem(item: MenuItem, now: PakistanNow = getPakistanNow()): MenuItemWithComputed {
  const isActiveNow = isMenuItemActive(item, now);
  const { scheduleLabel, statusLabel, countdownSeconds } = describeAvailability(item, now);

  return {
    ...item,
    isActiveNow,
    isSpecial: item.scheduleType !== "PERMANENT" && isActiveNow,
    scheduleLabel,
    statusLabel,
    countdownSeconds,
  };
}

export type KitchenWithMenu = Kitchen & { menuItems: MenuItem[] };

export interface KitchenSummary extends Kitchen {
  menuItems: MenuItemWithComputed[];
  activeMenuItemsCount: number;
  todaysSpecials: MenuItemWithComputed[];
  cuisines: string[];
}

export function serializeKitchenSummary(
  kitchen: KitchenWithMenu,
  now: PakistanNow = getPakistanNow()
): KitchenSummary {
  const menuItems = kitchen.menuItems.map((item) => serializeMenuItem(item, now));
  const cuisines = Array.from(new Set(menuItems.map((item) => item.cuisine)));

  return {
    ...kitchen,
    menuItems,
    activeMenuItemsCount: menuItems.filter((item) => item.isActiveNow).length,
    todaysSpecials: menuItems.filter((item) => item.isSpecial).slice(0, 3),
    cuisines,
  };
}

export interface KitchenDetail extends Kitchen {
  menuItems: MenuItemWithComputed[];
}

export function serializeKitchenDetail(
  kitchen: KitchenWithMenu,
  now: PakistanNow = getPakistanNow()
): KitchenDetail {
  return {
    ...kitchen,
    menuItems: kitchen.menuItems.map((item) => serializeMenuItem(item, now)),
  };
}
