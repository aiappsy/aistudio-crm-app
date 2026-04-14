import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "USD") {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    NOK: "kr",
    GBP: "£",
  };
  
  const symbol = symbols[currency] || symbols.USD;
  
  if (currency === "NOK") {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${symbol}`;
  }
  
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}
