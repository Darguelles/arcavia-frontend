/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  // Optional override for map tiles (real keyed provider). Falls back to OSM.
  readonly VITE_MAP_TILE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
