import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

let exchangeRates: Record<string, number> = {
  USD: 1,
  NOK: 11,
  EUR: 0.92,
  GBP: 0.78,
  SEK: 10.5,
  DKK: 6.8
};

try {
  const cached = localStorage.getItem("exchangeRates");
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed && typeof parsed === "object") {
      exchangeRates = { ...exchangeRates, ...parsed };
    }
  }
} catch (e) {}

export async function fetchExchangeRates() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    if (data && data.rates) {
      exchangeRates = { ...exchangeRates, ...data.rates, USD: 1 };
      localStorage.setItem("exchangeRates", JSON.stringify(exchangeRates));
      window.dispatchEvent(new Event("exchangeRatesUpdated"));
    }
  } catch (e) {
    console.error("Failed to fetch exchange rates", e);
  }
}

export function getCurrencySymbol(currency: string = "USD") {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    NOK: "kr",
    GBP: "£",
  };
  return symbols[currency] || symbols.USD;
}

export function convertBasePrice(usdPrice: number, targetCurrency: string = "USD") {
  if (exchangeRates[targetCurrency]) {
    return Math.ceil(usdPrice * exchangeRates[targetCurrency]);
  }
  return Math.ceil(usdPrice);
}

export function formatCurrency(amount: number, currency: string = "USD") {
  const symbol = getCurrencySymbol(currency);
  
  if (currency === "NOK" || currency === "SEK" || currency === "DKK") {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  }
  
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
