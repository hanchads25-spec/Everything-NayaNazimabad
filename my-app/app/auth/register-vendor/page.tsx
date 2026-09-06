import { PageHeader } from "@/components/layout/page-header";
import { RegisterVendorForm } from "@/components/vendor/register-vendor-form";
import { getCurrentUser } from "@/lib/session";

export default async function RegisterVendorPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [currentUser, { category }] = await Promise.all([getCurrentUser(), searchParams]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title="Become a Vendor" backHref="/profile" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-10">
        <p className="mb-3 text-xs text-muted-foreground">
          Sell on the marketplace or run a Home Kitchen / Restaurant. Fill in your details below —
          a Naya Nazimabad admin will verify your ID before your dashboard tools unlock.
        </p>

        <RegisterVendorForm
          defaultName={currentUser?.name}
          defaultPhone={currentUser?.phone}
          defaultEmail={currentUser?.email ?? undefined}
          defaultBlock={currentUser?.block ?? undefined}
          defaultHouseNumber={currentUser?.houseNumber ?? undefined}
          defaultCategory={category}
        />
      </main>
    </div>
  );
}
