export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  image_url: string | null;
  gallery_urls?: string[] | null;
  fitment: string | null;
  warranty: string | null;
  is_featured: boolean;
  categories?: { name: string; slug: string } | null;
};

export type CartLine = {
  id: string;
  quantity: number;
  product: Product;
};

export const PAYMENT_METHODS = [
  {
    value: "cash_on_delivery",
    label: "Cash on delivery",
    blurb: "Pay the driver in cash when your parts arrive.",
  },
  {
    value: "bank_transfer",
    label: "Bank transfer",
    blurb: "We email transfer details; parts ship once payment clears.",
  },
  {
    value: "pay_in_store",
    label: "Pay in store",
    blurb: "Reserve online and settle up at the counter on pickup.",
  },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export const FREE_SHIPPING_THRESHOLD = 250;
export const FLAT_SHIPPING_RATE = 19.5;

export function unitPrice(product: Product): number {
  return Number(product.sale_price ?? product.price);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + unitPrice(line.product) * line.quantity, 0);
}

export function shippingCost(subtotal: number, method: PaymentMethod | null): number {
  if (method === "pay_in_store") return 0;
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
}

const SESSION_KEY = "apex-cart-session";

export function getCartSessionToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}
