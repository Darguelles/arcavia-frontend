/**
 * Per-waypoint gameplay status (spec §8.6). Drives pin colour and list-item
 * state.
 *
 * NOTE / API GAP: no current endpoint returns per-waypoint status for the user
 * (`/me/progress` is mission/category-level only). Until the backend exposes it
 * — e.g. statuses embedded in the authed mission-detail response, or a
 * GET /me/waypoint-progress — everything renders as `todo`. The plumbing here is
 * status-driven so wiring real data is a one-line change.
 */
export type WaypointStatus = 'todo' | 'in_progress' | 'completed'

export const STATUS_COLOR: Record<WaypointStatus, string> = {
  todo: 'var(--color-wp-todo)',
  in_progress: 'var(--color-wp-active)',
  completed: 'var(--color-wp-done)',
}

export const STATUS_LABEL: Record<WaypointStatus, string> = {
  todo: 'Por visitar',
  in_progress: 'En progreso',
  completed: 'Completado',
}
