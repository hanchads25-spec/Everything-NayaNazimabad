import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { MosqueTimingsWidget } from "@/components/mosque-timings-widget";
import { CategoryCard } from "@/components/category-card";
import { categories } from "@/lib/categories";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />

      <main className="mx-auto w-full max-w-md flex-1 pb-28">
        <MosqueTimingsWidget />

        <section className="mt-6 px-4">
          <h2 className="font-heading text-base font-semibold">
            Explore Naya Nazimabad
          </h2>
          <p className="text-xs text-muted-foreground">
            Everything your neighborhood offers, in one place
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <CategoryCard key={category.key} category={category} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
