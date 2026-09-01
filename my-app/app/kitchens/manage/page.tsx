import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { CreateKitchenForm } from "@/components/kitchens/manage/create-kitchen-form";
import { ManageKitchen } from "@/components/kitchens/manage/manage-kitchen";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function ManageKitchensPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <PageHeader title="Manage Kitchen" backHref="/kitchens" />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-muted-foreground">Sign in to manage your kitchen listing.</p>
          <Button nativeButton={false} render={<Link href="/login?next=/kitchens/manage" />}>
            Continue as a demo resident
          </Button>
        </main>
      </div>
    );
  }

  const kitchen = await prisma.kitchen.findFirst({
    where: { ownerId: currentUser.id },
    include: { menuItems: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title="Manage Kitchen" subtitle={kitchen ? kitchen.name : "Set up your listing"} backHref="/kitchens" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-10">
        {kitchen ? <ManageKitchen kitchen={kitchen} /> : <CreateKitchenForm />}
      </main>
    </div>
  );
}
