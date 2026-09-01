import { ContinueAsButton } from "@/components/auth/continue-as-button";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const [users, currentUser] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="font-heading text-xl font-semibold">Everything Naya Nazimabad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          There&apos;s no login flow yet — pick a demo resident to continue as.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <ContinueAsButton
            key={user.id}
            userId={user.id}
            name={user.name}
            subtitle={`${user.phone}${user.block ? ` · Block ${user.block}` : ""}`}
            isActive={user.id === currentUser?.id}
          />
        ))}

        {users.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No demo users yet — run <code className="rounded bg-muted px-1">npm run db:seed</code>.
          </p>
        )}
      </div>
    </div>
  );
}
