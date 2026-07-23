import { haversineMeters, type LatLng } from './geo'

/**
 * Greedy nearest-neighbour ordering for the mission route (spec §10). Starting
 * from the player's position, repeatedly hop to the closest not-yet-visited
 * waypoint. A cheap, good-enough heuristic for the handful of stops in a
 * mission — no need for an exact TSP solver. Distances are straight-line
 * (Haversine); the actual street path is computed by the routing provider once
 * the order is fixed.
 */
export function orderByNearestNeighbor<T extends LatLng>(start: LatLng, points: T[]): T[] {
  const remaining = [...points]
  const ordered: T[] = []
  let current: LatLng = start

  while (remaining.length > 0) {
    let bestIndex = 0
    let bestDistance = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineMeters(current, remaining[i]!)
      if (d < bestDistance) {
        bestDistance = d
        bestIndex = i
      }
    }
    const [next] = remaining.splice(bestIndex, 1)
    ordered.push(next!)
    current = next!
  }
  return ordered
}
