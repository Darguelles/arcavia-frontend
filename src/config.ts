// API base. In dev, Vite proxies /api → http://localhost:8000 (see vite.config.ts),
// so the default empty string keeps requests same-origin. Override with VITE_API_BASE
// for a deployed backend on a different host.
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

// Consent version the client presents at registration. The server records this
// verbatim on the user (§6.10/§11); bump when the terms copy changes.
export const CONSENT_VERSION = '2026-01'
