export const COLOR_HEX: Record<string, string> = {
  black: "#171717",
  white: "#f5f5f5",
  beige: "#e8dcc8",
  brown: "#8b5e3c",
  gray: "#9ca3af",
  navy: "#1e293b",
  blue: "#3b82f6",
  green: "#16a34a",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#dc2626",
  pink: "#ec4899",
  purple: "#9333ea",
};

export function formatPrice(price: unknown): string {
  return `$${Number(price).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

export function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

export function notNull<T>(value: T): value is Exclude<T, null | undefined> {
  return value !== null && value !== undefined;
}
