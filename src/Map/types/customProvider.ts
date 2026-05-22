/**
 * Generic provider configuration — imagery overrides only.
 *
 * Allows configuring custom imagery tile providers in a vendor-agnostic way.
 * Terrain and layer (3D tileset) URLs are configured directly on the engine
 * the engine (hardcoded in useTerrainProviderPromise) or via the layer's own url field.
 */

export interface ImageryProviderEntry {
  id: string;
  url: string;
  credit?: string;
  maximumLevel?: number;
  minimumLevel?: number;
}

export interface CustomProviderConfig {
  imagery?: {
    providers?: ImageryProviderEntry[];
  };
}
