import type { CustomProviderConfig, ImageryProviderEntry, LayerProviderEntry } from "@reearth/core";

function parseEnvJson<T>(envVar: string | undefined): T[] {
  if (!envVar) return [];
  try {
    const parsed = JSON.parse(envVar);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn(`[buildExampleTileProvider] Failed to parse env JSON: ${envVar}`);
    return [];
  }
}

function appendToken(url: string, token: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${token}`;
}

// terrain.reearth.land doesn't send CORS headers, so in dev we route through the
// Vite proxy (/terrain-proxy) defined in vite.config.example.ts.
const REEARTH_TERRAIN_URL = "https://terrain.reearth.land/cesium-mesh/ellipsoid";
const REEARTH_TERRAIN_CREDIT = "Re:Earth Terrain, Mapterhorn";

/**
 * Build CustomProviderConfig from env vars.
 *
 * Env vars:
 *   EXAMPLE_TILE_SERVER_TOKEN  — auth token appended as ?token= to imagery and layer URLs
 *   EXAMPLE_IMAGERY_PROVIDERS  — JSON array of ImageryProviderEntry (URLs without token)
 *   EXAMPLE_LAYER_PROVIDERS    — JSON array of LayerProviderEntry (URLs without token)
 *
 * Terrain uses the public Re:Earth terrain service (hardcoded, no token needed).
 * Returns undefined when no imagery or layer providers are configured.
 */
export function buildExampleTileProvider(): CustomProviderConfig | undefined {
  const token: string | undefined = import.meta.env.EXAMPLE_TILE_SERVER_TOKEN || undefined;
  const rawImageryProviders = parseEnvJson<ImageryProviderEntry>(
    import.meta.env.EXAMPLE_IMAGERY_PROVIDERS,
  );
  const rawLayerProviders = parseEnvJson<LayerProviderEntry>(
    import.meta.env.EXAMPLE_LAYER_PROVIDERS,
  );

  if (rawImageryProviders.length === 0 && rawLayerProviders.length === 0) {
    return undefined;
  }

  const terrainUrl = import.meta.env.DEV
    ? REEARTH_TERRAIN_URL.replace("https://terrain.reearth.land", "/terrain-proxy")
    : REEARTH_TERRAIN_URL;

  const imageryProviders = token
    ? rawImageryProviders.map(p => ({ ...p, url: appendToken(p.url, token) }))
    : rawImageryProviders;

  const layerProviders = token
    ? rawLayerProviders.map(p => ({ ...p, url: appendToken(p.url, token) }))
    : rawLayerProviders;

  return {
    imagery: imageryProviders.length > 0 ? { providers: imageryProviders } : undefined,
    terrain: {
      providers: [{ id: "default", url: terrainUrl, credit: REEARTH_TERRAIN_CREDIT }],
    },
    layers: layerProviders.length > 0 ? { providers: layerProviders } : undefined,
  };
}
