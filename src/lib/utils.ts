import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Metric } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeFilters(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((v) => v.trim())
    .filter(Boolean)
}

export function normalizeDimensions(value: string): string[] {
  return value
    .split(/,/)
    .map((v) => v.trim())
    .filter(Boolean)
}

export function getMetricTimestamp(metric: Metric, key: "createdAt" | "updatedAt"): number {
  const value = metric[key]
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}
