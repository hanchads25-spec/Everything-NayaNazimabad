import { NextRequest, NextResponse } from "next/server";

import { isMenuItemActive } from "@/lib/kitchens/availability";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, UnauthenticatedError } from "@/lib/session";

interface CartLine {
  menuItemId: string;
  quantity: number;
}

/**
 * POST /api/kitchens/[id]/orders — in-app Cash on Delivery checkout.
 * Snapshots the ordered items (title/price at order time) into `items`
 * so later menu edits never retroactively change a past order, validates
 * every line is currently orderable via the availability engine, and
 * decrements tracked stock.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: kitchenId } = await params;

  try {
    const currentUser = await requireCurrentUser();

    const kitchen = await prisma.kitchen.findUnique({ where: { id: kitchenId } });
    if (!kitchen) {
      return NextResponse.json({ error: "Kitchen not found" }, { status: 404 });
    }
    if (!kitchen.isOpen) {
      return NextResponse.json({ error: "This kitchen is currently closed." }, { status: 409 });
    }

    const body = await request.json().catch(() => null);
    const deliveryAddress = typeof body?.deliveryAddress === "string" ? body.deliveryAddress.trim() : "";
    const cartLines: CartLine[] = Array.isArray(body?.items)
      ? body.items
          .map((line: unknown) => {
            const item = line as { menuItemId?: unknown; quantity?: unknown };
            const quantity = Number(item?.quantity);
            return typeof item?.menuItemId === "string" && Number.isFinite(quantity) && quantity > 0
              ? { menuItemId: item.menuItemId, quantity: Math.floor(quantity) }
              : null;
          })
          .filter((line: CartLine | null): line is CartLine => line !== null)
      : [];

    if (!deliveryAddress) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }
    if (cartLines.length === 0) {
      return NextResponse.json({ error: "Your order is empty" }, { status: 400 });
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: cartLines.map((line) => line.menuItemId) }, kitchenId },
    });
    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

    const orderItems: { menuItemId: string; title: string; price: number; quantity: number }[] = [];
    let totalAmount = 0;

    for (const line of cartLines) {
      const menuItem = menuItemsById.get(line.menuItemId);
      if (!menuItem) {
        return NextResponse.json({ error: "One of the items is no longer on the menu." }, { status: 409 });
      }
      if (!isMenuItemActive(menuItem)) {
        return NextResponse.json(
          { error: `"${menuItem.title}" isn't available right now.` },
          { status: 409 }
        );
      }
      if (menuItem.stockQty !== null && menuItem.stockQty < line.quantity) {
        return NextResponse.json(
          { error: `Only ${menuItem.stockQty} left of "${menuItem.title}".` },
          { status: 409 }
        );
      }

      orderItems.push({
        menuItemId: menuItem.id,
        title: menuItem.title,
        price: menuItem.price,
        quantity: line.quantity,
      });
      totalAmount += menuItem.price * line.quantity;
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.foodOrder.create({
        data: {
          buyerId: currentUser.id,
          kitchenId,
          items: orderItems,
          totalAmount,
          deliveryAddress,
          status: "PENDING",
        },
      });

      for (const line of cartLines) {
        const menuItem = menuItemsById.get(line.menuItemId)!;
        if (menuItem.stockQty !== null) {
          await tx.menuItem.update({
            where: { id: menuItem.id },
            data: { stockQty: Math.max(0, menuItem.stockQty - line.quantity) },
          });
        }
      }

      return created;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
