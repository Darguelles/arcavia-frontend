/// <reference types="vitest/config" />
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Optional HTTPS for the dev server — needed to test geolocation/camera on a
// phone (mobile browsers refuse them on a plain-http LAN IP). Off by default so
// desktop dev stays http; enable with VITE_DEV_HTTPS=true + a cert in ./certs
// (see README). The API is reached same-origin via the /api proxy below, so an
// https page never hits an http endpoint (no mixed content).
const certDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'certs')
const keyPath = path.join(certDir, 'dev-key.pem')
const certPath = path.join(certDir, 'dev-cert.pem')
const httpsEnabled = process.env.VITE_DEV_HTTPS === 'true' && fs.existsSync(keyPath)
const httpsConfig = httpsEnabled
  ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
  : undefined

// In Docker the API is another compose service (`api`); on the host it's
// localhost. Server-side proxy hop, so http here is fine even when the page is
// https.
const proxyTarget = process.env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Arcavia Quest',
        short_name: 'Arcavia',
        description: 'Explora la ciudad, escanea y resuelve retos.',
        theme_color: '#1f1a1e',
        background_color: '#1f1a1e',
        display: 'standalone',
        start_url: '/',
        // TODO: add raster icon-192.png / icon-512.png for widest install
        // support. The SVG works on modern browsers and avoids shipping a
        // broken manifest reference in the meantime.
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Cache-first for static assets; network-first (short timeout) for API GETs;
        // gameplay mutations are never cached — spec §11.
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith('/api/') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-get',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    https: httpsConfig,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
    coverage: {
      provider: 'v8',
      // Gate on unit-testable code: pure components, lib helpers, stores and the
      // API client. Browser/provider-integration modules (camera, Leaflet map,
      // shell, city gate) and thin data-fetch hooks are validated by Playwright
      // E2E + the §9 manual iOS device checklist, not unit line-coverage.
      include: [
        'src/components/**',
        'src/lib/**',
        'src/stores/**',
        'src/api/client.ts',
      ],
      exclude: [
        '**/tests/e2e/**',
        'src/components/MapView.tsx',
        'src/components/QrScanner.tsx',
        'src/components/AppShell.tsx',
        'src/components/CityGate.tsx',
        'src/components/RouteError.tsx',
        // A screen-level flow fragment (answer mutation + navigation)
        // extracted out of screens/CheckIn.tsx's predecessor so it can be
        // shared — validated by E2E, same bar as the screens/ directory it
        // used to live in, not the pure-component bar.
        'src/components/ChallengeQuestion.tsx',
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
})
