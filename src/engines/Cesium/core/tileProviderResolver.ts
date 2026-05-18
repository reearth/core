/**
 * Tile Provider Resolver
 * ----------------------
 * Utility functions to look up URLs and metadata
 * from TileProviderConfig override arrays.
 */

import type { TileProviderConfig } from "../../../Map/types/tileProvider";

/**
 * Resolve terrain URL from TileProviderConfig.
 * Uses the first entry with id 'default', or the first entry if none matches.
 */
export function resolveTerrainUrl(config: TileProviderConfig | undefined): string | null {
  if (!config) return null;
  const overrides = config.terrainOverrides;
  if (!overrides?.length) return null;
  return (overrides.find(t => t.id === "default") ?? overrides[0]).url;
}

/**
 * Resolve imagery URL from TileProviderConfig by preset id.
 * @param presetName - e.g. 'default', 'default_road', 'black_marble'
 */
export function resolveImageryUrl(
  config: TileProviderConfig | undefined,
  presetName: string,
): string | null {
  if (!config) return null;
  return config.imageryTileOverrides?.find(o => o.id === presetName)?.url ?? null;
}

/**
 * Resolve imagery credit/attribution by preset id.
 */
export function resolveImageryCredit(
  config: TileProviderConfig | undefined,
  presetName: string,
): string | undefined {
  if (!config) return undefined;
  return config.imageryTileOverrides?.find(o => o.id === presetName)?.credit;
}

/**
 * Resolve imagery maximum zoom level by preset id.
 */
export function resolveImageryMaxZoom(
  config: TileProviderConfig | undefined,
  presetName: string,
): number | undefined {
  if (!config) return undefined;
  return config.imageryTileOverrides?.find(o => o.id === presetName)?.maxZoomLevel;
}

/**
 * Resolve 3D tileset URL from TileProviderConfig by tileset id.
 * @param tilesetId - e.g. 'googlePhotorealistic'
 */
export function resolveTilesetUrl(
  config: TileProviderConfig | undefined,
  tilesetId: string,
): string | null {
  if (!config) return null;
  return config.layerSourceOverrides?.find(o => o.id === tilesetId)?.url ?? null;
}

/**
 * Get base URL from config (informational reference only).
 */
export function getBaseUrl(config: TileProviderConfig | undefined): string | undefined {
  return config?.baseUrl;
}
