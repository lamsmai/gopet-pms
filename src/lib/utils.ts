import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact VND formatting used across KPI tiles (e.g. 94.2M, 2.1B). */
export function vnd(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(amount % 1_000_000_000 === 0 ? 0 : 1)}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}k`;
  }
  return `${amount}`;
}

export function vndFull(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
