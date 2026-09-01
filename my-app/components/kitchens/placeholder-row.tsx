import { Sparkles, type LucideIcon } from "lucide-react";

export function PlaceholderRow({
  title,
  hint,
  icon: Icon = Sparkles,
}: {
  title: string;
  hint: string;
  icon?: LucideIcon;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-heading text-sm font-semibold">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="flex h-24 w-32 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 text-center"
          >
            <Icon className="size-4 text-muted-foreground" />
            <p className="px-2 text-[11px] leading-tight text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
