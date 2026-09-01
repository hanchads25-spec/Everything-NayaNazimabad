import { NextRequest, NextResponse } from "next/server";
import { CuisineType, ScheduleType } from "@prisma/client";

import { WEEKDAYS } from "@/lib/kitchens/availability";
import { serializeMenuItem } from "@/lib/kitchens/serialize";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, UnauthenticatedError } from "@/lib/session";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: kitchenId } = await params;

  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { kitchenId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ menuItems: menuItems.map((item) => serializeMenuItem(item)) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/**
 * POST /api/kitchens/[id]/menu-items — owner-only. Creates a dish with an
 * optional schedule (permanent / recurring weekly days / one-off date) and
 * time window, e.g. a midnight deal active 00:00-04:00.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: kitchenId } = await params;

  try {
    const currentUser = await requireCurrentUser();

    const kitchen = await prisma.kitchen.findUnique({ where: { id: kitchenId } });
    if (!kitchen) {
      return NextResponse.json({ error: "Kitchen not found" }, { status: 404 });
    }
    if (kitchen.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "You don't manage this kitchen." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : undefined;
    const price = Number(body?.price);
    const cuisine = body?.cuisine as CuisineType;
    const imageUrl = typeof body?.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : undefined;

    if (!title) return NextResponse.json({ error: "Dish name is required" }, { status: 400 });
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Enter a valid price" }, { status: 400 });
    }
    if (!cuisine || !(cuisine in CuisineType)) {
      return NextResponse.json({ error: "Select a cuisine type" }, { status: 400 });
    }

    const scheduleType: ScheduleType =
      body?.scheduleType && body.scheduleType in ScheduleType ? body.scheduleType : ScheduleType.PERMANENT;
    const activeDays: string[] = Array.isArray(body?.activeDays)
      ? body.activeDays.filter((day: unknown): day is string => typeof day === "string" && (WEEKDAYS as readonly string[]).includes(day))
      : [];
    const specificDate = typeof body?.specificDate === "string" && body.specificDate ? new Date(body.specificDate) : undefined;
    const startTime = typeof body?.startTime === "string" && body.startTime ? body.startTime : undefined;
    const endTime = typeof body?.endTime === "string" && body.endTime ? body.endTime : undefined;
    const stockQty =
      body?.stockQty === null || body?.stockQty === "" || body?.stockQty === undefined
        ? undefined
        : Number(body.stockQty);

    const menuItem = await prisma.menuItem.create({
      data: {
        kitchenId,
        title,
        description,
        price,
        cuisine,
        imageUrl,
        scheduleType,
        activeDays,
        specificDate,
        startTime,
        endTime,
        stockQty: stockQty !== undefined && Number.isFinite(stockQty) ? stockQty : undefined,
        isManualActive: body?.isManualActive === false ? false : true,
      },
    });

    return NextResponse.json({ menuItem: serializeMenuItem(menuItem) }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
