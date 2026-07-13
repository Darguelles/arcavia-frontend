import { describe, expect, it } from 'vitest'
import { FALLBACK_TILE_URL, resolveTileUrl } from '../../src/lib/mapTiles'

describe('resolveTileUrl', () => {
  it('passes through a real {z}/{x}/{y} template', () => {
    const url = 'https://tiles.maptiler.example/streets/{z}/{x}/{y}.png?key=abc'
    expect(resolveTileUrl(url)).toBe(url)
  })

  it('falls back for the seed placeholder host (fixes the black map)', () => {
    expect(resolveTileUrl('https://tiles.example.com/lima/{z}/{x}/{y}.png')).toBe(FALLBACK_TILE_URL)
  })

  it('falls back for empty / undefined tile_url', () => {
    expect(resolveTileUrl('')).toBe(FALLBACK_TILE_URL)
    expect(resolveTileUrl(undefined)).toBe(FALLBACK_TILE_URL)
  })

  it('falls back when the template is missing the {z} placeholder', () => {
    expect(resolveTileUrl('https://tiles.live/streets.png')).toBe(FALLBACK_TILE_URL)
  })
})
