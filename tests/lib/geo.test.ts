import { describe, expect, it } from 'vitest'
import { haversineMeters, formatDistance } from '../../src/lib/geo'

describe('haversineMeters', () => {
  it('is ~0 for identical points', () => {
    expect(haversineMeters({ lat: -12.05, lng: -77.03 }, { lat: -12.05, lng: -77.03 })).toBeCloseTo(
      0,
      5
    )
  })

  it('approximates a known short distance', () => {
    // ~157m north (0.001414° lat is roughly 157m)
    const d = haversineMeters({ lat: -12.05, lng: -77.03 }, { lat: -12.04859, lng: -77.03 })
    expect(d).toBeGreaterThan(140)
    expect(d).toBeLessThan(175)
  })
})

describe('formatDistance', () => {
  it('shows metres below 1km', () => {
    expect(formatDistance(42.4)).toBe('42 m')
  })
  it('shows kilometres at/above 1km', () => {
    expect(formatDistance(1400)).toBe('1.4 km')
  })
})
