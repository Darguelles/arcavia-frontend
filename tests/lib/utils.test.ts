import { describe, expect, it } from 'vitest'
import { cn, pickTranslation } from '../../src/lib/utils'

describe('cn', () => {
  it('merges conflicting tailwind classes, last wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
  it('drops falsy values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b')
  })
})

describe('pickTranslation', () => {
  const translations = {
    es: { name: 'Plaza Mayor' },
    'es-PE': { name: 'Plaza de Armas' },
    en: { name: 'Main Square' },
  }

  it('prefers the exact locale', () => {
    expect(pickTranslation(translations, 'name', 'es-PE', 'x')).toBe('Plaza de Armas')
  })
  it('falls back to the language prefix', () => {
    expect(pickTranslation(translations, 'name', 'es-ES', 'x')).toBe('Plaza Mayor')
  })
  it('falls back to the default when missing', () => {
    expect(pickTranslation(translations, 'name', 'fr', 'Default')).toBe('Default')
    expect(pickTranslation(undefined, 'name', 'es', 'Default')).toBe('Default')
  })
})
