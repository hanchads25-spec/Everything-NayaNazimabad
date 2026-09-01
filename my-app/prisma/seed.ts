import "dotenv/config";
import { PrismaClient, ListingCategory, Block } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Demo users for the mock "Continue as" session picker (no real auth yet).
 * `ayesha` and `sana` sell items on the marketplace; `bilal` is a buyer.
 */
const demoUsers = [
  {
    key: "ayesha",
    name: "Ayesha Khan",
    phone: "+92 300 1112233",
    block: Block.A,
    houseNumber: "A-12",
  },
  {
    key: "sana",
    name: "Sana Malik",
    phone: "+92 300 4445566",
    block: Block.F,
    houseNumber: "F-4",
  },
  {
    key: "bilal",
    name: "Bilal Ahmed",
    phone: "+92 300 7778899",
    block: Block.C,
    houseNumber: "C-21",
  },
] as const;

async function main() {
  const users = new Map<string, string>();

  for (const demoUser of demoUsers) {
    const user = await prisma.user.upsert({
      where: { phone: demoUser.phone },
      update: { name: demoUser.name, block: demoUser.block, houseNumber: demoUser.houseNumber },
      create: {
        name: demoUser.name,
        phone: demoUser.phone,
        block: demoUser.block,
        houseNumber: demoUser.houseNumber,
      },
    });
    users.set(demoUser.key, user.id);
  }

  const ayeshaId = users.get("ayesha")!;
  const sanaId = users.get("sana")!;

  const listings = [
    {
      sellerId: ayeshaId,
      title: "Study table with chair",
      description: "Sturdy wooden study table with matching chair. Light scratches, great condition otherwise.",
      category: ListingCategory.FURNITURE,
      price: 4500,
      block: Block.A,
      images: ["https://picsum.photos/seed/nn-table/600/400"],
    },
    {
      sellerId: ayeshaId,
      title: "iPhone 12 - 128GB",
      description: "Used iPhone 12, battery health 87%. Comes with box and charger.",
      category: ListingCategory.GADGETS,
      price: 65000,
      block: Block.A,
      images: ["https://picsum.photos/seed/nn-iphone/600/400"],
    },
    {
      sellerId: sanaId,
      title: "Kids' bicycle (ages 5-8)",
      description: "Barely used kids' bicycle, red, with training wheels included.",
      category: ListingCategory.OTHER,
      price: 6000,
      block: Block.F,
      images: ["https://picsum.photos/seed/nn-bike/600/400"],
    },
    {
      sellerId: sanaId,
      title: "Complete O-Level Physics book set",
      description: "Full set of O-Level Physics textbooks and past papers, minimal highlighting.",
      category: ListingCategory.BOOKS,
      price: 2500,
      block: Block.F,
      images: ["https://picsum.photos/seed/nn-books/600/400"],
    },
  ];

  for (const listing of listings) {
    const existing = await prisma.marketplaceListing.findFirst({
      where: { sellerId: listing.sellerId, title: listing.title },
    });
    if (existing) continue;

    await prisma.marketplaceListing.create({
      data: {
        sellerId: listing.sellerId,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        price: listing.price,
        block: listing.block,
        imageUrls: listing.images,
        images: {
          create: listing.images.map((url) => ({ url })),
        },
      },
    });
  }

  console.log("Seed complete. Demo users:");
  for (const demoUser of demoUsers) {
    console.log(`  - ${demoUser.name} (${demoUser.phone}) -> id ${users.get(demoUser.key)}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
