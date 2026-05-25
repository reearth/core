/**
 * Generic provider configuration for overriding external data sources.
 *
 * - imagery.providers: imagery tile providers keyed by id
 * - layers.providers: 3D tileset providers keyed by id
 *
 * Terrain is configured via viewer/engine terrain settings (see useTerrainProviderPromise)
 * or via each layer's own `url` field.
 */

export type ImageryProviderEntry = {
  id: string;
  url: string;
  credit?: string;
  maximumLevel?: number;
  minimumLevel?: number;
};

export type LayerProviderEntry = {
  id: string;
  url: string;
  options?: Record<string, unknown>;
};

export type CustomProviderConfig = {
  imagery?: {
    providers?: ImageryProviderEntry[];
  };
  layers?: {
    providers?: LayerProviderEntry[];
  };
};
