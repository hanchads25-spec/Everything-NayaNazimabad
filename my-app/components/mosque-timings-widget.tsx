import { Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatPrayerTime,
  getNextPrayerKey,
  todayMosqueTimings,
} from "@/lib/mosque-timings";

export function MosqueTimingsWidget() {
  const now = new Date();
  const todayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const nextPrayerKey = getNextPrayerKey(todayMosqueTimings, now);

  return (
    <Card className="mx-4 mt-4">
      <CardHeader className="flex items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock3 className="size-4 text-primary" />
          Mosque Timings
        </CardTitle>
        <span className="text-xs text-muted-foreground">{todayLabel}</span>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {todayMosqueTimings.map((timing) => {
            const isNext = timing.key === nextPrayerKey;
            return (
              <div
                key={timing.key}
                className={cn(
                  "flex min-w-[4.2rem] flex-none flex-col items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-center",
                  isNext && "border-primary/40 bg-primary/5"
                )}
              >
                <span className="text-[11px] font-medium text-muted-foreground">
                  {timing.label}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatPrayerTime(timing.time)}
                </span>
                {isNext && (
                  <Badge variant="secondary" className="mt-0.5 px-1.5 text-[10px]">
                    Next
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
