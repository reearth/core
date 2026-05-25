import { WebMercatorTilingScheme } from "@cesium/engine";
import {
  ImageryProvider,
  IonImageryProvider,
  OpenStreetMapImageryProvider,
  IonWorldImageryStyle,
  UrlTemplateImageryProvider,
  DiscardEmptyTileImagePolicy,
} from "cesium";

import { JapanGSIOptimalBVmapLabelImageryProvider } from "./labels/JapanGSIOptimalBVmapVectorMapLabel/JapanGSIOptimalBVmapLabelImageryProvider";

const PRESET_TILE_TYPES = [
  // Dynamic Cesium Ion asset — asset ID supplied per-tile via cesiumIonAssetId field
  "cesium_ion",

  // Public presets — always available, no auth required
  "open_street_map",
  "japan_gsi_standard",
  "stamen_watercolor",
  "carto_light",
  "url",

  // Cesium Ion presets — require user-provided Ion token (scene.default.ion)
  "cesium_ion_default",
  "cesium_ion_labelled",
  "cesium_ion_road",
  "cesium_ion_earth_at_night",

  // Legacy aliases — kept for backward compatibility with existing apps
  "default", // → cesium_ion_default
  "default_road", // → cesium_ion_road
  "default_label", // → cesium_ion_labelled
  "black_marble", // → cesium_ion_earth_at_night
];

export type PresetTileType = (typeof PRESET_TILE_TYPES)[number];

export const isValidPresetTileType = (type: string | undefined): type is PresetTileType => {
  return PRESET_TILE_TYPES.includes(type as PresetTileType);
};

export type TileOptions = {
  url?: string;
  cesiumIonAccessToken?: string;
  cesiumIonAssetId?: number | string;
  heatmap?: boolean;
  tile_zoomLevel?: number[];
};

export const tiles = {
  // --- Dynamic Cesium Ion asset ---
  // Uses per-tile cesiumIonAssetId; requires cesiumIonAccessToken.
  cesium_ion: (opts?: TileOptions) => {
    if (!opts?.cesiumIonAssetId) return null;
    const NumberAssetId = parseInt(String(opts.cesiumIonAssetId), 10);
    if (isNaN(NumberAssetId)) {
      console.warn(`Invalid cesiumIonAssetId: ${opts.cesiumIonAssetId}`);
      return null;
    }
    return IonImageryProvider.fromAssetId(NumberAssetId, {
      accessToken: opts?.cesiumIonAccessToken,
    }).catch(err => {
      console.error(err);
      return undefined as unknown as ImageryProvider;
    });
  },

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

  stamen_watercolor: () =>
    new UrlTemplateImageryProvider({
      url: "https://watercolormaps.collection.cooperhewitt.org/tile/watercolor/{z}/{x}/{y}.jpg",
      credit: "Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL.",
      maximumLevel: 16,
    }),

  carto_light: () =>
    new UrlTemplateImageryProvider({
      url: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      credit:
        "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, © <a href='https://carto.com/attributions'>CARTO</a>",
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
  // --- Legacy aliases ---
} as any as {
  [K in PresetTileType]: (opts?: TileOptions) => Promise<ImageryProvider> | ImageryProvider | null;
};

// Populate legacy aliases after object literal to allow forward references.
Object.assign(tiles, {
  default: tiles.cesium_ion_default,
  default_road: tiles.cesium_ion_road,
  default_label: tiles.cesium_ion_labelled,
  black_marble: tiles.cesium_ion_earth_at_night,
});

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
