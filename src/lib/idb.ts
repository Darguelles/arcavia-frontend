import { get, set, del } from 'idb-keyval'

/**
 * Thin IndexedDB wrapper for state that must survive a reload but is NOT
 * session-secret (spec §11 forbids localStorage for session data; the token
 * stays in memory, but the selected city can persist here safely).
 */
export const idbStore = {
  get: <T>(key: string) => get<T>(key),
  set: <T>(key: string, value: T) => set(key, value),
  del: (key: string) => del(key),
}
