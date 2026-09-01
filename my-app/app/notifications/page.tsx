import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/notifications");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: currentUser.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (notifications.some((notification) => !notification.isRead)) {
    await prisma.notification.updateMany({
      where: { userId: currentUser.id, isRead: false },
      data: { isRead: true },
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PageHeader title="Notifications" backHref="/" />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">
        {notifications.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.link ?? "#"}
                className="flex flex-col gap-0.5 rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{notification.title}</p>
                  {!notification.isRead && <Badge className="size-2 rounded-full p-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{notification.body}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
