/**
 * Per-category marker glyph (Figma frame 115:3 — the "Culturales" / "Patrocinado"
 * filter chips). The design distinguishes categories with diamond shapes rather
 * than colour, so gameplay categories read the same in light map tiles and on the
 * dark itinerary sheet. `currentColor` drives the fill/stroke — set the colour via
 * the parent's text class (Figma uses the gold accent #b19071 → `text-gold`).
 *
 * The API's category set is dynamic (mission.categories / waypoint.category_id),
 * so variants are assigned deterministically by position — the first two match the
 * Figma (◆ Culturales, ◈ Patrocinado) and further categories cycle the remaining
 * shapes.
 */
export type CategoryGlyphVariant = 'solid' | 'ringed' | 'hollow'

const VARIANT_ORDER: CategoryGlyphVariant[] = ['solid', 'ringed', 'hollow']

/** Stable glyph for the Nth category of an itinerary (0 = ◆, 1 = ◈, …). */
export function glyphForCategory(index: number): CategoryGlyphVariant {
  return VARIANT_ORDER[index % VARIANT_ORDER.length]
}

// Diamond = square rotated 45°, points at top/right/bottom/left of a 14×14 box.
const OUTER = 'M7 1.6 L12.4 7 L7 12.4 L1.6 7 Z'
const INNER = 'M7 4.5 L9.5 7 L7 9.5 L4.5 7 Z'
const FILLED = 'M7 1 L13 7 L7 13 L1 7 Z'

export function CategoryGlyph({
  variant,
  size = 12,
  className,
}: {
  variant: CategoryGlyphVariant
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {variant === 'solid' && <path d={FILLED} fill="currentColor" />}
      {variant === 'ringed' && (
        <>
          <path d={OUTER} stroke="currentColor" strokeWidth="1.3" />
          <path d={INNER} fill="currentColor" />
        </>
      )}
      {variant === 'hollow' && <path d={OUTER} stroke="currentColor" strokeWidth="1.3" />}
    </svg>
  )
}

/**
 * Raw SVG markup for a glyph, for contexts that take an HTML string rather than
 * JSX — chiefly the Leaflet map pins (`L.divIcon`), so pins share the exact same
 * diamonds as the filter chips and list rows. `color` is baked in (no
 * `currentColor`, which wouldn't inherit inside an injected icon).
 */
export function categoryGlyphSvg(
  variant: CategoryGlyphVariant,
  { size = 12, color = '#000' }: { size?: number; color?: string } = {}
): string {
  const paths =
    variant === 'solid'
      ? `<path d="${FILLED}" fill="${color}"/>`
      : variant === 'ringed'
        ? `<path d="${OUTER}" stroke="${color}" stroke-width="1.3" fill="none"/><path d="${INNER}" fill="${color}"/>`
        : `<path d="${OUTER}" stroke="${color}" stroke-width="1.3" fill="none"/>`
  return `<svg width="${size}" height="${size}" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`
}
