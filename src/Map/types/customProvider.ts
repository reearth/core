/**
 * Generic provider configuration — auth-agnostic, URL-first design.
 *
 * These types allow configuring different tile service providers
 * in a provider-agnostic way, making @reearth/core work with
 * various backends without coupling to any specific vendor.
 *
 * Note: Cesium Ion is not configured here. When users select cesiumion
 * terrain in the editor, the token flows through meta.cesiumIonAccessToken.
 */

export interface ImageryProviderEntry {
  id: string;
  name?: string;
  nameJa?: string;
  url: string;
  credit?: string;
  maximumLevel?: number;
  minimumLevel?: number;
}

export interface TerrainProviderEntry {
  id: string;
  name?: string;
  nameJa?: string;
  url: string;
  requestVertexNormals?: boolean;
  requestWaterMask?: boolean;
  credit?: string;
}

export interface LayerProviderEntry {
  id: string;
  url: string;
  options?: Record<string, unknown>;
}

export interface CustomProviderConfig {
  imagery?: {
    providers?: ImageryProviderEntry[];
    remove?: string[];
  };
  terrain?: {
    providers?: TerrainProviderEntry[];
    remove?: string[];
  };
  layers?: {
    providers?: LayerProviderEntry[];
    remove?: string[];
  };
}
