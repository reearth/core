import type { CustomProviderConfig, ImageryProviderEntry } from "@reearth/core";

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

/**
 * Build CustomProviderConfig from env vars.
 *
 * Env vars:
 *   EXAMPLE_TILE_SERVER_TOKEN  — auth token appended as ?token= to imagery URLs
 *   EXAMPLE_IMAGERY_PROVIDERS  — JSON array of ImageryProviderEntry (URLs without token)
 *
 * Terrain URL is hardcoded in core (useTerrainProviderPromise).
 * Layer URLs are set directly on individual layer data.url fields.
 * Returns undefined when no imagery providers are configured.
 */
export function buildExampleTileProvider(): CustomProviderConfig | undefined {
  const token: string | undefined = import.meta.env.EXAMPLE_TILE_SERVER_TOKEN || undefined;
  const rawImageryProviders = parseEnvJson<ImageryProviderEntry>(
    import.meta.env.EXAMPLE_IMAGERY_PROVIDERS,
  );

  if (rawImageryProviders.length === 0) {
    return undefined;
  }

  const imageryProviders = token
    ? rawImageryProviders.map(p => ({ ...p, url: appendToken(p.url, token) }))
    : rawImageryProviders;

  return {
    imagery: { providers: imageryProviders },
  };
}
