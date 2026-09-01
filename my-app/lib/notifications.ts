import { NotificationType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  client?: Prisma.TransactionClient;
}) {
  const db = params.client ?? prisma;
  return db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    },
  });
}
