import Link from "next/link";
import { Clock } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export function VendorPendingScreen({
  title = "Vendor Hub",
  backHref = "/profile",
}: {
  title?: string;
  backHref?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title={title} backHref={backHref} />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Clock className="size-7" />
        </span>
        <div>
          <h1 className="font-heading text-base font-semibold">Under review</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Your business details and ID are currently under review by Naya Nazimabad Admin. Access
            will be granted upon verification.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/profile" />}>
          Back to Profile
        </Button>
      </main>
    </div>
  );
}
