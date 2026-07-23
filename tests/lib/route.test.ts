import { describe, expect, it } from 'vitest'
import { orderByNearestNeighbor } from '../../src/lib/route'

// A little grid near Lima; ids encode position so we can assert the visit order.
const A = { id: 'A', lat: -12.0, lng: -77.0 }
const B = { id: 'B', lat: -12.001, lng: -77.0 } // ~111 m south of A
const C = { id: 'C', lat: -12.003, lng: -77.0 } // further south
const D = { id: 'D', lat: -12.006, lng: -77.0 } // furthest south

describe('orderByNearestNeighbor', () => {
  it('visits nearest-first from the start', () => {
    const start = { lat: -12.0, lng: -77.0 } // right at A
    const order = orderByNearestNeighbor(start, [D, B, A, C]).map((p) => p.id)
    expect(order).toEqual(['A', 'B', 'C', 'D'])
  })

  it('picks the nearest point to start regardless of input order', () => {
    const start = { lat: -12.0065, lng: -77.0 } // closest to D
    const order = orderByNearestNeighbor(start, [A, B, C, D]).map((p) => p.id)
    expect(order[0]).toBe('D')
  })

  it('returns an empty list for no points', () => {
    expect(orderByNearestNeighbor({ lat: 0, lng: 0 }, [])).toEqual([])
  })

  it('does not mutate the input array', () => {
    const input = [D, B, A, C]
    orderByNearestNeighbor({ lat: -12.0, lng: -77.0 }, input)
    expect(input.map((p) => p.id)).toEqual(['D', 'B', 'A', 'C'])
  })
})
