import { Building2, ShoppingBag, UtensilsCrossed, Wrench, type LucideIcon } from "lucide-react";

export interface Category {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon's background + foreground color. */
  accent: string;
}

export const categories: Category[] = [
  {
    key: "food",
    title: "Food & Home Kitchens",
    description: "Homemade meals & tiffins nearby",
    href: "/kitchens",
    icon: UtensilsCrossed,
    accent: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    key: "marketplace",
    title: "OLX-Style Marketplace",
    description: "Buy & sell pre-owned items",
    href: "/marketplace",
    icon: ShoppingBag,
    accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "technicians",
    title: "Local Technicians",
    description: "Electricians, plumbers & more",
    href: "/technicians",
    icon: Wrench,
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "property",
    title: "Property",
    description: "Rent, buy & sell in the area",
    href: "/property",
    icon: Building2,
    accent: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
];
