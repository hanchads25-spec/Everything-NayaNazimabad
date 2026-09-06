import { CreateListingForm } from "@/components/marketplace/create-listing-form";
import { PageHeader } from "@/components/layout/page-header";
import { VendorPendingScreen } from "@/components/vendor/vendor-pending-screen";
import { requireVendorAccess } from "@/lib/vendor-auth";

export default async function CreateListingPage() {
  const gate = await requireVendorAccess("/auth/register-vendor?category=MARKETPLACE_SELLER");
  if (!gate.approved) {
    return <VendorPendingScreen title="Sell an Item" backHref="/marketplace" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title="Sell an Item" backHref="/marketplace" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-10">
        <CreateListingForm />
      </main>
    </div>
  );
}
