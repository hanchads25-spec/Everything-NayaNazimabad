import Link from "next/link";
import { ChefHat, ChevronRight, ShieldCheck, Store, UserPlus } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title="Profile" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-28">
        {currentUser ? (
          <>
            <Card>
              <CardContent className="flex items-center gap-3 px-4">
                <Avatar className="size-12">
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{currentUser.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {currentUser.phone}
                    {currentUser.block ? ` · Block ${currentUser.block}` : ""}
                  </p>
                </div>
                <SignOutButton />
              </CardContent>
            </Card>

            <section className="mt-5">
              <h2 className="font-heading text-sm font-semibold">Vendor Hub</h2>
              <p className="text-xs text-muted-foreground">
                {currentUser.businessName
                  ? currentUser.isApproved
                    ? "Your vendor account is approved — manage your listings below."
                    : "Your registration is under review by the Naya Nazimabad admin."
                  : "Sell on the marketplace or run a Home Kitchen / Restaurant."}
              </p>

              <div className="mt-3 flex flex-col gap-2">
                <VendorHubLink
                  href="/marketplace/create"
                  icon={Store}
                  title="Sell Marketplace Item"
                  subtitle="List something for sale"
                />
                <VendorHubLink
                  href="/marketplace/manage"
                  icon={Store}
                  title="My Listings"
                  subtitle="Manage your marketplace items"
                />
                <VendorHubLink
                  href="/kitchens/manage"
                  icon={ChefHat}
                  title="Manage My Kitchen"
                  subtitle="Dishes, schedules & stock"
                />

                {!currentUser.businessName && (
                  <VendorHubLink
                    href="/auth/register-vendor"
                    icon={UserPlus}
                    title="Become a Vendor"
                    subtitle="Register your business & get verified"
                  />
                )}

                {currentUser.role === "ADMIN" && (
                  <VendorHubLink
                    href="/admin/vendors"
                    icon={ShieldCheck}
                    title="Vendor Approvals"
                    subtitle="Review pending vendor applications"
                  />
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              You&apos;re browsing as a guest. Sign in to see your order history, or register as a
              vendor to start selling.
            </p>
            <div className="flex w-full flex-col gap-2">
              <Button nativeButton={false} render={<Link href="/login?next=/profile" />}>
                Continue as a demo resident
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/auth/register-vendor" />}
              >
                Become a Vendor
              </Button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function VendorHubLink({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: typeof Store;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 transition-colors hover:bg-muted"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
