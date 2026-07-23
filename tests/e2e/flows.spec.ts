import { test } from '@playwright/test'

/**
 * Full user flows (spec §14.2). These require the API (arcavia-api on :8000)
 * with seed data and are skipped until a seeded backend is wired into CI.
 * Set E2E_BACKEND=1 to enable.
 *
 * Coverage to implement here:
 *  - Registration → login → browse: register with birth_date + consent → /missions → open a mission.
 *  - Geo check-in happy path (geo-only): use Playwright's `context.setGeolocation` +
 *    `grantPermissions(['geolocation'])` to place the browser inside a waypoint's geofence,
 *    open the CheckIn screen, wait for dwell to satisfy → challenges render → answer correctly
 *    → ResultBanner shows points/keyword/fun_fact → progress updates on return.
 *  - Geo + QR check-in: a waypoint with requires_qr=true — set geolocation inside the
 *    geofence, then feed a decoded QR token → both factors verified → challenges render.
 *  - Geo + keyword check-in: a waypoint with requires_keyword=true — dwell satisfied reveals
 *    the on-site question; assert a wrong answer can be retried, a correct one completes.
 *  - Category-threshold completion: answer enough waypoints across both categories + one riddle
 *    → mission_complete → mission shows completed on /missions.
 *  - Permission-denied path: deny geolocation via `grantPermissions([])` → assert the
 *    explicit "activa el permiso de ubicación" message renders, not a generic error.
 *  - Accuracy-too-poor path: mock a fix with a very large `accuracy` value → assert the
 *    "Ubicación precisa" guidance banner renders instead of silently stalling.
 *  - Frozen-coordinate flag: use the DevTools/Playwright sensor override to hold one exact
 *    coordinate across several fixes → dwell still completes (never a hard reject), and
 *    assert (via an admin API call) the resulting attempt carries the zero_jitter flag.
 *  - Avatar upload round-trip: upload → /profile reflects the new image.
 *  - Reward earned end-to-end: complete a seeded waypoint/mission with an active reward →
 *    RewardEarnedToast on result → reward appears on /rewards with currently_valid: true.
 */
const backendReady = process.env.E2E_BACKEND === '1'

test.describe('full gameplay flows (needs seeded API)', () => {
  test.skip(!backendReady, 'Set E2E_BACKEND=1 with arcavia-api seeded on :8000')

  test.fixme('registration → login → browse missions', () => {})
  test.fixme('geo check-in happy path shows points/keyword/fun_fact', () => {})
  test.fixme('geo + QR check-in requires both factors', () => {})
  test.fixme('geo + keyword check-in allows a wrong-answer retry', () => {})
  test.fixme('category-threshold completion marks mission complete', () => {})
  test.fixme('permission-denied check-in shows the explicit message', () => {})
  test.fixme('accuracy-too-poor check-in shows the precise-location guidance', () => {})
  test.fixme('frozen-coordinate check-in still completes and flags zero_jitter', () => {})
  test.fixme('avatar upload round-trip reflects on /profile', () => {})
  test.fixme('reward earned shows toast and appears on /rewards', () => {})
})
