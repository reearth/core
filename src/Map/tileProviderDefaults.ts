/**
 * Tile Provider Default Configurations
 * -------------------------------------
 * Factory functions for creating TileProviderConfig objects.
 * All tile URLs must be provided by the caller — this module
 * does not generate or hard-code any URLs.
 */

import type { TileOverride, TileProviderConfig } from "./types/tileProvider";

export type { TileOverride };

/**
 * Create a TileProviderConfig for Terravista.
 * The caller (e.g. visualizer) is responsible for building the override arrays
 * from its own env vars or configuration.
 *
 * @example
 * ```typescript
 * import { createTerravistaConfig } from '@reearth/core';
 *
 * const baseUrl = "https://tiles.eukarya.io";
 * const config = createTerravistaConfig(token, {
 *   imageryTileOverrides: [
 *     { id: "default", url: `${baseUrl}/imagery/google-satellite/{z}/{x}/{y}.webp`, credit: "© Google" },
 *   ],
 *   terrainOverrides: [
 *     { id: "default", url: `${baseUrl}/cesium-mesh/ellipsoid/layer.json` },
 *   ],
 *   layerSourceOverrides: [
 *     { id: "googlePhotorealistic", url: `${baseUrl}/google3d/root.json` },
 *   ],
 *   onTokenExpired: async () => ({ accessToken: await refreshToken() }),
 * });
 * ```
 */
export function createTerravistaConfig(
  accessToken: string,
  options?: {
    baseUrl?: string;
    expiresAt?: number;
    onTokenExpired?: () => Promise<{ accessToken: string; expiresAt?: number }>;
    imageryTileOverrides?: TileOverride[];
    terrainOverrides?: TileOverride[];
    layerSourceOverrides?: TileOverride[];
  },
): TileProviderConfig {
  return {
    type: "terravista",
    baseUrl: options?.baseUrl,
    auth: {
      type: "bearer",
      accessToken,
      expiresAt: options?.expiresAt,
      onTokenExpired: options?.onTokenExpired,
    },
    imageryTileOverrides: options?.imageryTileOverrides,
    terrainOverrides: options?.terrainOverrides,
    layerSourceOverrides: options?.layerSourceOverrides,
  };
}

/**
 * Create a TileProviderConfig for a fully custom tile server.
 *
 * @example
 * ```typescript
 * import { createCustomConfig } from '@reearth/core';
 *
 * const config = createCustomConfig({
 *   auth: { type: 'query-param', accessToken: 'my-api-key', queryParamName: 'api_key' },
 *   imageryTileOverrides: [
 *     { id: "default", url: "https://my-tiles.com/{z}/{x}/{y}.png" },
 *   ],
 *   terrainOverrides: [
 *     { id: "default", url: "https://my-terrain.com/layer.json" },
 *   ],
 * });
 * ```
 */
export function createCustomConfig(options: {
  baseUrl?: string;
  auth?: {
    type: "bearer" | "query-param";
    accessToken?: string;
    queryParamName?: string;
  };
  imageryTileOverrides?: TileOverride[];
  terrainOverrides?: TileOverride[];
  layerSourceOverrides?: TileOverride[];
}): TileProviderConfig {
  return {
    type: "custom",
    baseUrl: options.baseUrl,
    auth: options.auth
      ? {
          type: options.auth.type,
          accessToken: options.auth.accessToken,
          queryParamName: options.auth.queryParamName,
        }
      : undefined,
    imageryTileOverrides: options.imageryTileOverrides,
    terrainOverrides: options.terrainOverrides,
    layerSourceOverrides: options.layerSourceOverrides,
  };
}
