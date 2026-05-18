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
  "default",
  "default_road",
  "default_label",
  "open_street_map",
  "black_marble",
  "japan_gsi_standard",
  "url",
];

export type PresetTileType = (typeof PRESET_TILE_TYPES)[number];

export const isValidPresetTileType = (type: string | undefined): type is PresetTileType => {
  return PRESET_TILE_TYPES.includes(type as PresetTileType);
};

export type TileOptions = {
  url?: string;
  cesiumIonAccessToken?: string;
  heatmap?: boolean;
  tile_zoomLevel?: number[];
  tileProvider?: TileProviderConfig;
};

/**
 * Create imagery provider from TileProviderConfig URL (terravista or custom).
 * Returns null if no URL is configured — callers fall back to legacy Ion path.
 */
function createPresetImageryProvider(
  presetName: string,
  opts?: TileOptions,
): Promise<ImageryProvider> | ImageryProvider | null {
  const { tileProvider } = opts ?? {};

  const url = resolveImageryUrl(tileProvider, presetName);
  if (!url) return null;

  return new UrlTemplateImageryProvider({
    url,
    credit: resolveImageryCredit(tileProvider, presetName),
    maximumLevel: resolveImageryMaxZoom(tileProvider, presetName),
  });
}

export const tiles = {
  // Standard presets - now support TileProviderConfig
  default: (opts?: TileOptions) => {
    const result = createPresetImageryProvider("default", opts);
    if (result) return result;

    // Legacy fallback
    return IonImageryProvider.fromAssetId(IonWorldImageryStyle.AERIAL, {
      accessToken: opts?.cesiumIonAccessToken,
    }).catch(err => {
      console.error(err);
      return undefined as unknown as ImageryProvider;
    });
  },

  default_road: (opts?: TileOptions) => {
    const result = createPresetImageryProvider("default_road", opts);
    if (result) return result;

    // Legacy fallback
    return IonImageryProvider.fromAssetId(IonWorldImageryStyle.ROAD, {
      accessToken: opts?.cesiumIonAccessToken,
    }).catch(err => {
      console.error(err);
      return undefined as unknown as ImageryProvider;
    });
  },

  default_label: ({ cesiumIonAccessToken } = {}) =>
    IonImageryProvider.fromAssetId(IonWorldImageryStyle.AERIAL_WITH_LABELS, {
      accessToken: cesiumIonAccessToken,
    }).catch(err => {
      console.error(err);
      return undefined as unknown as ImageryProvider;
    }),

  open_street_map: () =>
    new OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org",
      credit: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }),

  black_marble: (opts?: TileOptions) => {
    const result = createPresetImageryProvider("black_marble", opts);
    if (result) return result;

    // Legacy fallback
    return IonImageryProvider.fromAssetId(3812, {
      accessToken: opts?.cesiumIonAccessToken,
    }).catch(err => {
      console.error(err);
      return undefined as unknown as ImageryProvider;
    });
  },

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
