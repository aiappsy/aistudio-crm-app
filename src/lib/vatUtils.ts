export type VatRegion = "NO" | "SE" | "DK" | "INT";
export type ProductType = "standard" | "food" | "culture" | "books";

export const VAT_RATES: Record<VatRegion, Record<ProductType, number>> = {
  NO: {
    standard: 0.25,
    food: 0.15,
    culture: 0.12,
    books: 0.25, // Books are often 0% in NO but let's keep it simple for now or use 0
  },
  SE: {
    standard: 0.25,
    food: 0.12,
    culture: 0.06,
    books: 0.06,
  },
  DK: {
    standard: 0.25,
    food: 0.25,
    culture: 0.25,
    books: 0.25,
  },
  INT: {
    standard: 0,
    food: 0,
    culture: 0,
    books: 0,
  }
};

export function calculateVat(amount: number, region: VatRegion, type: ProductType) {
  const rate = VAT_RATES[region][type];
  const vatAmount = amount * rate;
  return {
    rate,
    vatAmount,
    total: amount + vatAmount
  };
}
