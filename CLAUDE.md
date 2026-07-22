# Arcavia Quest — Player PWA (`arcavia-frontend`)

Mobile-first PWA (402px canvas), built **design-to-code from Figma**.
React 19 · Vite · Tailwind v4 · React Router v7 · TanStack Query.

## Verify
Run `npm run ci` (typecheck + prettier `--check` + vitest coverage) before treating any
change as done. Tests live under `tests/`, mirroring `src/`. Use Docker if host Node is
unavailable.

## Backend & spec
Talks to the Arcavia v2 API in `../arcavia-api`. Response DTOs are **hand-mirrored** in
`src/types/api.ts` — keep in sync manually with `arcavia-api/app/schemas/*.py` (no codegen).
Product spec lives in `../specs` (screens reference it as `spec §N`).

---

## Figma binding — source of design truth

Figma file **ARCAVIA QUEST**, key **`1LfEMYlMFIbgsE6X4EbHIS`**.
Every screen also records its frame in a top-of-file `// Figma frame N:N` comment.

| Screen file          | Figma frame (layer name)  | node-id          |
| -------------------- | ------------------------- | ---------------- |
| `Home.tsx`           | HOME                      | `6:20`           |
| `Login.tsx`          | INGRESO                   | `26:4`           |
| `Register.tsx`       | FORMULARIO DE REGISTO     | `5:2`            |
| `Missions.tsx`       | MISIONES                  | `9:175`          |
| `MissionDetail.tsx`  | PERFIL MISIÓN             | `12:305`         |
| `PhaseItinerary.tsx` | ITINERARIO / PRIMERA FASE | `115:3` (`115:123`) |
| `Challenge.tsx`      | DESAFIO                   | `115:164`        |
| `Result.tsx`         | PREGUNTA CORRECTA / INCORRECTA | `14:287` / `121:389` |
| `Menu.tsx`           | MENU                      | `135:619`        |
| `Profile.tsx`        | PERFIL DE USUARIO         | `135:642`        |
| `Ranking.tsx`        | RANKING                   | `135:644`        |
| `AccountSettings.tsx`| DATOS PERSONALES          | `197:99` ⚠︎       |

`Rewards.tsx` and `NotFound.tsx` have no dedicated frame (built from spec).

All node-ids except AccountSettings are confirmed against each screen's `// Figma frame`
comment. **⚠︎ `AccountSettings.tsx → 197:99` is unverified** — the code cites only `spec §8.13`,
so this id comes from a prior note and has not been re-confirmed against Figma. Verify (pull
node `197:99` and check its layer name is `DATOS PERSONALES`) before syncing that screen.

### Sync protocol (no URL, no whole-file scan)
The **committed code + this doc are the source of truth** for what's implemented. To pull a
design change, name the screen — e.g. *"sync Itinerario from Figma"*. Then:
1. Look up its node-id above and fetch **only that frame** via the Figma MCP
   `get_design_context` (node-id + the file key above — no URL, no discovery scan).
2. Diff against the current screen file and apply just the deltas.
3. **Preserve the standing corrections below** — the code deliberately deviates from the
   static mockup. Never revert them to "match Figma."

Screens you don't name are not fetched. This keeps each sync bounded to what changed.

### Standing corrections / intentional deviations from the mockup (keep on sync)
- **Auth is by email**, not the username the mockup shows.
- Registration adds a real **birth_date date picker + consent checkbox** (legal, spec §6.10).
- **Camera/QR scan** is a real device flow (mockup is static).
- Map is a **live Leaflet map** (mockup is a flat image). Pins are status-coloured teardrops
  carrying the **category diamond glyph**; ITINERARIO has **category filter chips**
  (`Culturales` ◆ / `Patrocinado` ◈) and its phase accordion **loads collapsed**.
- **No Figma image/icon assets are committed** — use typographic / CSS / `Avatar` stand-ins.
  `public/` holds only `icon.svg`.

### Shared glyph source
`src/components/CategoryGlyph.tsx` is the single source for the category diamonds — the React
`<CategoryGlyph>` (chips, list rows) and `categoryGlyphSvg()` (Leaflet pins) share one set of
paths. Change the shapes there, not in the pin HTML.

## Optional: component-level Code Connect
For reusable components (buttons, cards, `CategoryGlyph`), Figma **Code Connect**
(`*.figma.tsx`) can map them so component-level design edits are traceable in-repo. Not set up
yet — ask if you want it.
