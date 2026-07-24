# Arcavia Quest — Player PWA

Browser-based PWA players use to browse Missions, walk to real-world Waypoints,
scan QR codes, and answer trivia. Implements the _Arcavia Quest — Player PWA
Frontend Architecture & Implementation Spec_ (`specs/arcavia-frontend-spec.md`)
against the v2 API (`arcavia-api`).

## Stack

React 19 · TypeScript · Vite 8 · Tailwind v4 · TanStack Query (server state) ·
Zustand (client/session state) · React Router 7 · Leaflet / react-leaflet ·
html5-qrcode · Vitest + Testing Library · Playwright · vite-plugin-pwa.

> **React 19, not 18.** The spec text says React 18, but the monorepo (admin app)
> is on React 19 and `react-leaflet@5` requires it. We match the monorepo for
> consistency and library compatibility. This is the one deliberate deviation.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api → http://localhost:8000
```

Run the backend (`arcavia-api`) on `:8000` for real data. Camera + geolocation
need a **secure context** — `localhost` works; `http://192.168.x.x` over LAN does
**not**. Use the dev-HTTPS setup below to test on a real device (see §9 of the spec).

### Testing on a phone (same Wi-Fi) with geolocation

Mobile browsers refuse geolocation/camera on a plain-`http` LAN IP, so the dev
server can serve **https** with a self-signed cert:

1. Generate a cert whose SAN includes your Mac's LAN IP (find it with
   `ipconfig getifaddr en0`):
   ```bash
   cd arcavia-frontend && mkdir -p certs
   openssl req -x509 -newkey rsa:2048 -nodes -days 825 \
     -keyout certs/dev-key.pem -out certs/dev-cert.pem -subj "/CN=arcavia-dev" \
     -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:<YOUR_LAN_IP>"
   ```
   `certs/` is gitignored — never commit it.
2. Start the server with HTTPS enabled: `VITE_DEV_HTTPS=true npm run dev`
   (the root `docker compose` setup reads this from a `.env` — see the repo-root
   `.env` example).
3. On the phone open `https://<YOUR_LAN_IP>:3000` and accept the certificate
   warning once. The app calls `/api` **same-origin** (Vite proxies it to the
   backend), so an https page never hits an http endpoint — and the Secure auth
   cookie works, which it can't over plain http.

### Scripts

| Script | What |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build (+ PWA service worker) |
| `npm run test` / `test:coverage` | Vitest unit/component tests |
| `npm run test:e2e` | Playwright E2E (needs the app running) |
| `npm run ci` | typecheck + format:check + test:coverage (the merge gate) |

## Architecture

```
src/
  app/         App shell, providers (boot/session restore), router (lazy routes), guards
  screens/     One component per route (§5)
  components/  Shared, reusable UI (§6 inventory)
  stores/      Zustand: authStore, citySessionStore (IndexedDB), scanSessionStore
  api/         TanStack Query hooks, one file per resource + client.ts + queryClient.ts
  lib/         geo, i18n, validation, idb wrapper, utils
  types/       Hand-mirrored API DTOs (src/types/api.ts)
```

Key decisions from the spec:

- **Access token in memory only** (`authStore`) — never localStorage/sessionStorage
  (§11). The refresh token is an httpOnly cookie; on reload we silently restore the
  session via `/auth/refresh`. Selected city persists to **IndexedDB** (`idb-keyval`).
- **All server state through TanStack Query.** Query keys are namespaced by
  city/mission so a city switch never serves stale cross-city data. `staleTime`
  ≈ 5 min to match the backend Redis TTL (§7/§13).
- **Route-level code splitting** (§13). The heavy bundles are isolated:
  `PhaseItinerary` carries Leaflet (~159 KB), `Challenge` carries html5-qrcode
  (~375 KB) — neither loads on `/` or `/missions`.
- **Error handling.** `apiClient` unwraps the v2 `{ error: { code, message,
  details } }` envelope (and FastAPI's `{ detail }`) into a typed `ApiClientError`,
  so screens branch on stable `code`s (`OUT_OF_RANGE`, `INVALID_QR`,
  `QR_WAYPOINT_MISMATCH`, …) rather than parsing messages (§8.8).
- **PWA**: manifest + service worker via vite-plugin-pwa. Cache-first for static
  assets, network-first (4 s timeout) for API GETs, no caching for gameplay
  mutations. `apple-mobile-web-app-capable` is **deliberately omitted** — iOS
  standalone breaks camera access (§9/§11).

## Design source

Figma `1LfEMYlMFIbgsE6X4EbHIS`. Tokens (palette + Montserrat) are pulled into
`src/index.css` `@theme`: `ink #1f1a1e`, `ink-card #3f3c3e`, `gold #b19071`,
`cream #ffebd9`, `mist #f4f4f4`. Use the semantic classes (`bg-ink`, `text-cream`,
`bg-gold`) rather than raw hex.

## Known gaps / follow-ups (raised against the API, not guessed around)

These are places where the current v2 API doesn't yet expose what a screen needs.
Each is implemented defensively with a clear TODO so wiring real data is small:

1. **Per-waypoint status** — no endpoint returns `user_waypoint_progress.status`
   per waypoint (`/me/progress` is mission/category-level). Pins and list items
   render as `todo` until the API embeds statuses in the authed mission detail or
   adds `GET /me/waypoint-progress`. See `src/components/waypointStatus.ts`.
2. **Mission/waypoint images** — `MissionCard`/`MissionDetail` have no image field;
   cards use a warm gradient placeholder and accept an `imageUrl` for when it lands.
3. **Leaderboard names** — entries carry only `user_id` (no display name); we show
   rank + points + a shortened id, and highlight the current user.
4. **Waypoint points on result** — `geo-checkin`/`answer` responses don't include
   the waypoint's points, so the itinerary passes them via navigation state; a
   direct-hit result screen omits the "+N pts" badge.
5. **Forgot password** — no endpoint (§8.3); the login link routes to support mail,
   not a dead flow.
6. **Home marketing copy** — several Figma sections are Lorem-ipsum; real Spanish
   copy is used where present, placeholders omitted. Needs designer/client sign-off.
7. **Ranking layout** — Figma frame is design-pending (§8.12); the list is built to
   contract, confirm visual treatment before polish.
8. **PWA raster icons** — manifest currently references `icon.svg`; add
   `icon-192.png` / `icon-512.png` for widest install support.

## Testing

- **Unit/component** (Vitest): every shared component in §6, plus stores, the API
  client (error-envelope + 401→refresh), and lib helpers. `npm run ci` gates line
  coverage ≥ 80% on unit-testable code. Camera/map/provider-integration modules
  (`QrScanner`, `MapView`, `AppShell`, `CityGate`) are excluded from the coverage
  gate — they're validated by E2E and the manual device checklist.
- **E2E** (Playwright): `tests/e2e/smoke.spec.ts` runs backend-free (public routes,
  guards, form validation). `tests/e2e/flows.spec.ts` holds the full §14.2 flows,
  skipped until a seeded API is wired in (`E2E_BACKEND=1`).
- **iOS manual checklist (§9)** — real-device camera in Safari, Chrome-on-iOS, and
  the file-input fallback. Not automatable; run at build week 5–6. **Highest
  schedule risk in the project.**
