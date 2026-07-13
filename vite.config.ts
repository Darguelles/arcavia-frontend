/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

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
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
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
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
})
