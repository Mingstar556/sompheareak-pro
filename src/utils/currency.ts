import { Currency } from "@/types/store";

export const EXCHANGE_RATE_KHR = 4100;

export function formatPrice(amountUsd: number, currency: Currency): string {
  if (currency === "KHR") {
    const khr = Math.round(amountUsd * EXCHANGE_RATE_KHR);
    return `${khr.toLocaleString()} ៛`;
  }
  return `$${amountUsd.toFixed(2)}`;
}

export function formatDiscountPrice(originalUsd: number, discountPct: number, currency: Currency): {
  original: string;
  discounted: string;
  saved: string;
} {
  const discountedUsd = originalUsd * (1 - discountPct / 100);
  const savedUsd = originalUsd - discountedUsd;

  return {
    original: formatPrice(originalUsd, currency),
    discounted: formatPrice(discountedUsd, currency),
    saved: formatPrice(savedUsd, currency),
  };
}
