export function formatPkr(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `Rs. ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export const LISTING_CATEGORY_LABELS: Record<string, string> = {
  SECONDHAND: "Secondhand",
  BOOKS: "Books",
  GADGETS: "Gadgets",
  FURNITURE: "Furniture",
  CLOTHING: "Clothing",
  OTHER: "Other",
};

export const LISTING_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
};

export const VENDOR_TYPE_LABELS: Record<string, string> = {
  HOME_KITCHEN: "Home Kitchen",
  RESTAURANT: "Restaurant",
};

export const CUISINE_LABELS: Record<string, string> = {
  DESI: "Desi",
  FAST_FOOD: "Fast Food",
  CHINESE: "Chinese",
  BAKED_GOODS: "Baked Goods",
  TIFFIN: "Tiffin",
  OTHER: "Other",
};

export const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  PERMANENT: "Always on",
  RECURRING_WEEKLY: "Weekly schedule",
  SPECIFIC_DATE: "One-off date",
};

export const FOOD_ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
