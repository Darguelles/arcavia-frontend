import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Translations } from '../types/api'

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Resolve a translated content field (§12). Content strings come from the API's
 * per-locale `translations` blob; fall back to the exact locale's base, then the
 * language prefix (es-PE → es), then the provided default.
 */
export function pickTranslation(
  translations: Translations | undefined,
  field: string,
  locale: string,
  fallback: string
): string {
  if (!translations) return fallback
  const lang = locale.split('-')[0]
  return translations[locale]?.[field] ?? translations[lang]?.[field] ?? fallback
}
