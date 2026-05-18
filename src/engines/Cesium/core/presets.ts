import { WebMercatorTilingScheme } from "@cesium/engine";
import {
  ImageryProvider,
  IonImageryProvider,
  OpenStreetMapImageryProvider,
  IonWorldImageryStyle,
  UrlTemplateImageryProvider,
  DiscardEmptyTileImagePolicy,
} from "cesium";

import type { TileProviderConfig } from "../../../Map/types/tileProvider";

import { JapanGSIOptimalBVmapLabelImageryProvider } from "./labels/JapanGSIOptimalBVmapVectorMapLabel/JapanGSIOptimalBVmapLabelImageryProvider";
import {
  resolveImageryUrl,
  resolveImageryCredit,
  resolveImageryMaxZoom,
} from "./tileProviderResolver";

const PRESET_TILE_TYPES = [
  // Dynamic Cesium Ion asset — asset ID supplied per-tile via ionAssetId field
  "cesium_ion",

  // Terravista presets — require TileProviderConfig; no Ion fallback
  "terravista_google_satellite",
  "terravista_google_roadmap",
  "terravista_black_marble",

  // Public presets — always available, no auth required
  "open_street_map",
  "japan_gsi_standard",
  "url",

  // Cesium Ion presets — require user-provided Ion token (scene.default.ion)
  "cesium_ion_default",
  "cesium_ion_labelled",
  "cesium_ion_road",
  "cesium_ion_earth_at_night",
];

export type PresetTileType = (typeof PRESET_TILE_TYPES)[number];

export const isValidPresetTileType = (type: string | undefined): type is PresetTileType => {
  return PRESET_TILE_TYPES.includes(type as PresetTileType);
};

export type TileOptions = {
  url?: string;
  cesiumIonAccessToken?: string;
  ionAssetId?: number;
  heatmap?: boolean;
  tile_zoomLevel?: number[];
  tileProvider?: TileProviderConfig;
};

/**
 * Create imagery provider from TileProviderConfig override array.
 * Returns null if no matching override is configured.
 */
function createPresetImageryProvider(
  presetName: string,
  opts?: TileOptions,
): Promise<ImageryProvider> | ImageryProvider | null {
  const url = resolveImageryUrl(opts?.tileProvider, presetName);
  if (!url) return null;

  return new UrlTemplateImageryProvider({
    url,
    credit: resolveImageryCredit(opts?.tileProvider, presetName),
    maximumLevel: resolveImageryMaxZoom(opts?.tileProvider, presetName),
  });
}

export const tiles = {
  // --- Dynamic Cesium Ion asset ---
  // Uses per-tile ionAssetId; requires cesiumIonAccessToken.
  cesium_ion: (opts?: TileOptions) => {
    if (!opts?.ionAssetId) return null;
    return IonImageryProvider.fromAssetId(opts.ionAssetId, {
      accessToken: opts?.cesiumIonAccessToken,
    }).catch(err => {
      console.error(err);
      return undefined as unknown as ImageryProvider;
    });
  },

  // --- Terravista presets ---
  // Each resolves by its own name as the override ID in TileProviderConfig.
  // Returns null when TileProviderConfig is not configured.
  terravista_google_satellite: (opts?: TileOptions) =>
    createPresetImageryProvider("terravista_google_satellite", opts),

  terravista_google_roadmap: (opts?: TileOptions) =>
    createPresetImageryProvider("terravista_google_roadmap", opts),

  terravista_black_marble: (opts?: TileOptions) =>
    createPresetImageryProvider("terravista_black_marble", opts),

  // --- Public presets ---
  open_street_map: () =>
    new OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org",
      credit: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }),

  japan_gsi_standard: () =>
    new OpenStreetMapImageryProvider({
      url: "https://cyberjapandata.gsi.go.jp/xyz/std/",
      credit:
        "<a href='https://maps.gsi.go.jp/development/ichiran.html'>国土地理院</a>, Shoreline data is derived from: United States. National Imagery and Mapping Agency. \"Vector Map Level 0 (VMAP0).\" Bethesda, MD: Denver, CO: The Agency; USGS Information Services, 1997.",
    }),

  url: ({ url, heatmap, tile_zoomLevel }: TileOptions = {}) =>
    url
      ? new UrlTemplateImageryProvider({
          url,
          tileDiscardPolicy: heatmap ? new DiscardEmptyTileImagePolicy() : undefined,
          minimumLevel: tile_zoomLevel?.[0],
          maximumLevel: tile_zoomLevel?.[1],
        })
      : null,

  // --- Cesium Ion presets ---
  // Require the user to configure a Cesium Ion access token in their scene (scene.default.ion).
  cesium_ion_default: (opts?: TileOptions) =>
    IonImageryProvider.fromAssetId(IonWorldImageryStyle.AERIAL, {
      accessToken: opts?.cesiumIonAccessToken,
    }).catch(err => {
      console.error(err);
      return undefined as unknown as ImageryProvider;
    }),

  cesium_ion_labelled: (opts?: TileOptions) =>
    IonImageryProvider.fromAssetId(IonWorldImageryStyle.AERIAL_WITH_LABELS, {
      accessToken: opts?.cesiumIonAccessToken,
    }).catch(err => {
      console.error(err);
      return undefined as unknown as ImageryProvider;
    }),

  cesium_ion_road: (opts?: TileOptions) =>
    IonImageryProvider.fromAssetId(IonWorldImageryStyle.ROAD, {
      accessToken: opts?.cesiumIonAccessToken,
    }).catch(err => {
      console.error(err);
      return undefined as unknown as ImageryProvider;
    }),

  cesium_ion_earth_at_night: (opts?: TileOptions) =>
    IonImageryProvider.fromAssetId(3812, {
      accessToken: opts?.cesiumIonAccessToken,
    }).catch(err => {
      console.error(err);
      return undefined as unknown as ImageryProvider;
    }),
} as {
  [K in PresetTileType]: (opts?: TileOptions) => Promise<ImageryProvider> | ImageryProvider | null;
};

export const labelTiles = {
  japan_gsi_optimal_bvmap: (params: {
    url: string;
    minimumLevel?: number;
    maximumLevel?: number;
    minimumDataLevel: number;
    maximumDataLevel: number;
  }) =>
    new JapanGSIOptimalBVmapLabelImageryProvider({
      url: params.url,
      tilingScheme: new WebMercatorTilingScheme(),
      tileWidth: 256,
      tileHeight: 256,
      minimumDataLevel: params.minimumDataLevel,
      maximumDataLevel: params.maximumDataLevel,
    }),
};
