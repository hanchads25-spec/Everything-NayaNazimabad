import { NextRequest, NextResponse } from "next/server";
import { CuisineType, ScheduleType } from "@prisma/client";

import { WEEKDAYS } from "@/lib/kitchens/availability";
import { serializeMenuItem } from "@/lib/kitchens/serialize";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, UnauthenticatedError } from "@/lib/session";

async function getOwnedMenuItemOr404(kitchenId: string, menuItemId: string, userId: string) {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: { kitchen: true },
  });

  if (!menuItem || menuItem.kitchenId !== kitchenId) {
    return { error: NextResponse.json({ error: "Menu item not found" }, { status: 404 }) };
  }
  if (menuItem.kitchen.ownerId !== userId) {
    return { error: NextResponse.json({ error: "You don't manage this kitchen." }, { status: 403 }) };
  }
  return { menuItem };
}

/**
 * PATCH /api/kitchens/[id]/menu-items/[menuItemId] — owner-only. Handles the
 * one-tap active toggle, the alarm-style scheduler (schedule type / days /
 * date / time window), and the stock tracker in one endpoint.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; menuItemId: string }> }
) {
  const { id: kitchenId, menuItemId } = await params;

  try {
    const currentUser = await requireCurrentUser();
    const { error } = await getOwnedMenuItemOr404(kitchenId, menuItemId, currentUser.id);
    if (error) return error;

    const body = await request.json().catch(() => null);
    const data: Record<string, unknown> = {};

    if (typeof body?.isManualActive === "boolean") data.isManualActive = body.isManualActive;
    if (typeof body?.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (typeof body?.description === "string") data.description = body.description.trim() || null;
    if (body?.price !== undefined) {
      const price = Number(body.price);
      if (Number.isFinite(price) && price > 0) data.price = price;
    }
    if (body?.cuisine && body.cuisine in CuisineType) data.cuisine = body.cuisine as CuisineType;
    if (typeof body?.imageUrl === "string") data.imageUrl = body.imageUrl.trim() || null;

    if (body?.scheduleType && body.scheduleType in ScheduleType) {
      data.scheduleType = body.scheduleType as ScheduleType;
    }
    if (Array.isArray(body?.activeDays)) {
      data.activeDays = body.activeDays.filter(
        (day: unknown): day is string => typeof day === "string" && (WEEKDAYS as readonly string[]).includes(day)
      );
    }
    if (body?.specificDate !== undefined) {
      data.specificDate = body.specificDate ? new Date(body.specificDate) : null;
    }
    if (body?.startTime !== undefined) data.startTime = body.startTime || null;
    if (body?.endTime !== undefined) data.endTime = body.endTime || null;

    if (body?.stockQty !== undefined) {
      data.stockQty = body.stockQty === null || body.stockQty === "" ? null : Number(body.stockQty);
    }
    // Convenience: bump/decrement stock atomically, e.g. { adjustStockBy: -1 } after an order.
    if (typeof body?.adjustStockBy === "number") {
      const current = await prisma.menuItem.findUnique({ where: { id: menuItemId }, select: { stockQty: true } });
      if (current?.stockQty !== null && current?.stockQty !== undefined) {
        data.stockQty = Math.max(0, current.stockQty + body.adjustStockBy);
      }
    }

    const updated = await prisma.menuItem.update({ where: { id: menuItemId }, data });
    return NextResponse.json({ menuItem: serializeMenuItem(updated) });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; menuItemId: string }> }
) {
  const { id: kitchenId, menuItemId } = await params;

  try {
    const currentUser = await requireCurrentUser();
    const { error } = await getOwnedMenuItemOr404(kitchenId, menuItemId, currentUser.id);
    if (error) return error;

    await prisma.menuItem.delete({ where: { id: menuItemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
