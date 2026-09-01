"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { KitchenCard } from "@/components/kitchens/kitchen-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CUISINE_LABELS } from "@/lib/format";
import type { KitchenSummary } from "@/lib/kitchens/serialize";

const VENDOR_TABS = [
  { value: "ALL", label: "All" },
  { value: "HOME_KITCHEN", label: "Home Kitchens" },
  { value: "RESTAURANT", label: "Restaurants" },
] as const;

const CUISINE_PILLS = Object.entries(CUISINE_LABELS) as [string, string][];

export function DiscoveryFeed({ initialKitchens }: { initialKitchens: KitchenSummary[] }) {
  const [vendorTab, setVendorTab] = useState<string>("ALL");
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kitchens, setKitchens] = useState<KitchenSummary[]>(initialKitchens);
  const [isLoading, setIsLoading] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (vendorTab !== "ALL") params.set("vendorType", vendorTab);
        if (cuisine) params.set("cuisine", cuisine);
        if (query.trim()) params.set("q", query.trim());

        const response = await fetch(`/api/kitchens?${params.toString()}`, { signal: controller.signal });
        const data = await response.json();
        if (response.ok) setKitchens(data.kitchens ?? []);
      } catch {
        // ignore aborted/failed requests — the last successful list stays visible
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [vendorTab, cuisine, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 rounded-full bg-muted p-1">
        {VENDOR_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setVendorTab(tab.value)}
            className={cn(
              "flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors",
              vendorTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search dishes or kitchens…"
          className="pl-9"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CUISINE_PILLS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setCuisine((current) => (current === value ? null : value))}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              cuisine === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={cn("flex flex-col gap-2 transition-opacity", isLoading && "opacity-60")}>
        {kitchens.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No kitchens match your filters yet.
          </p>
        ) : (
          kitchens.map((kitchen) => <KitchenCard key={kitchen.id} kitchen={kitchen} />)
        )}
      </div>
    </div>
  );
}
