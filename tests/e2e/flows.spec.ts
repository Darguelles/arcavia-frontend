import { test } from '@playwright/test'

/**
 * Full user flows (spec §14.2). These require the API (arcavia-api on :8000)
 * with seed data and are skipped until a seeded backend is wired into CI.
 * Set E2E_BACKEND=1 to enable.
 *
 * Coverage to implement here:
 *  - Registration → login → browse: register with birth_date + consent → /missions → open a mission.
 *  - Full scan-and-answer loop: mock geolocation + a decoded QR token → validate-scan → answer
 *    correctly → ResultBanner shows points/keyword/fun_fact → progress updates on return.
 *  - Category-threshold completion: answer enough waypoints across both categories + one riddle
 *    → mission_complete → mission shows completed on /missions.
 *  - Out-of-range scan: mock geolocation far from the waypoint → assert OUT_OF_RANGE message.
 *  - Avatar upload round-trip: upload → /profile reflects the new image.
 *  - Reward earned end-to-end: complete a seeded waypoint/mission with an active reward →
 *    RewardEarnedToast on result → reward appears on /rewards with currently_valid: true.
 */
const backendReady = process.env.E2E_BACKEND === '1'

test.describe('full gameplay flows (needs seeded API)', () => {
  test.skip(!backendReady, 'Set E2E_BACKEND=1 with arcavia-api seeded on :8000')

  test.fixme('registration → login → browse missions', () => {})
  test.fixme('scan-and-answer loop shows points/keyword/fun_fact', () => {})
  test.fixme('category-threshold completion marks mission complete', () => {})
  test.fixme('out-of-range scan shows the OUT_OF_RANGE message', () => {})
  test.fixme('avatar upload round-trip reflects on /profile', () => {})
  test.fixme('reward earned shows toast and appears on /rewards', () => {})
})
