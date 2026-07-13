import type { Layer, LayerSimple } from "../mantle";

import type { TileProperty, ViewerProperty } from "./types/viewerProperty";

const CESIUM_ION_URL_PATTERN = "ion.cesium.com";
const CESIUM_ION_LEGACY_TILE_TYPES = new Set([
  "default",
  "default_road",
  "default_label",
  "black_marble",
]);

function isIonUrl(url?: string | null): boolean {
  return !!url && url.includes(CESIUM_ION_URL_PATTERN);
}

function tileUsesIon(tile: TileProperty): boolean {
  if (!tile.type) return false;
  if (tile.type.startsWith("cesium_ion")) return true;
  if (CESIUM_ION_LEGACY_TILE_TYPES.has(tile.type)) return true;
  return false;
}

function terrainUsesIon(property?: ViewerProperty): boolean {
  const terrain = property?.terrain;
  if (!terrain?.enabled) return false;
  if (terrain.type === "cesium" || terrain.type === "cesiumion") return true;
  if (isIonUrl(property?.assets?.cesium?.terrain?.ionUrl)) return true;
  return false;
}

function layerUsesIon(layer: LayerSimple): boolean {
  const data = layer.data;
  if (!data) return false;
  if (data.type === "osm-buildings") return true;
  if (data.type === "google-photorealistic") {
    return data.provider === "cesium-ion";
  }
  if (isIonUrl(data.url)) return true;
  return false;
}

function anyLayerUsesIon(layer: Layer): boolean {
  if (layer.type === "group") {
    return layer.children.some(anyLayerUsesIon);
  }
  return layerUsesIon(layer);
}

export function computeHasCesiumIonAsset(property?: ViewerProperty, layers?: Layer[]): boolean {
  if (property?.tiles?.some(tileUsesIon)) return true;
  if (terrainUsesIon(property)) return true;
  if (layers?.some(anyLayerUsesIon)) return true;
  return false;
}
