/**
 * Map tile-URL resolution (spec §10). A city's `tile_url` should be a real
 * {z}/{x}/{y} template; when it's missing or a seed placeholder (e.g. the
 * "tiles.example.com" values) we fall back to a live provider so the map never
 * renders blank. Override the fallback with a real keyed provider via
 * VITE_MAP_TILE_URL. Public OSM is fine for low-volume dev only — don't use it
 * at production volume.
 */
export const FALLBACK_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

/** Returns a usable tile URL, substituting the fallback for empty/placeholder inputs. */
export function resolveTileUrl(tileUrl: string | undefined): string {
  if (!tileUrl || !tileUrl.includes('{z}') || tileUrl.includes('example.com')) {
    return FALLBACK_TILE_URL
  }
  return tileUrl
}
