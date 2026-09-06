import { PageHeader } from "@/components/layout/page-header";
import { CreateKitchenForm } from "@/components/kitchens/manage/create-kitchen-form";
import { ManageKitchen } from "@/components/kitchens/manage/manage-kitchen";
import { VendorPendingScreen } from "@/components/vendor/vendor-pending-screen";
import { prisma } from "@/lib/prisma";
import { requireVendorAccess } from "@/lib/vendor-auth";

export default async function ManageKitchensPage() {
  const gate = await requireVendorAccess("/auth/register-vendor?category=HOME_KITCHEN");
  if (!gate.approved) {
    return <VendorPendingScreen title="Manage Kitchen" backHref="/kitchens" />;
  }
  const currentUser = gate.user;

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
