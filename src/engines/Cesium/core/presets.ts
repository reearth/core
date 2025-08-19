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

export const tiles = {
  default: ({ cesiumIonAccessToken } = {}) =>
    IonImageryProvider.fromAssetId(IonWorldImageryStyle.AERIAL, {
      accessToken: cesiumIonAccessToken,
    }).catch(console.error),
  default_label: ({ cesiumIonAccessToken } = {}) =>
    IonImageryProvider.fromAssetId(IonWorldImageryStyle.AERIAL_WITH_LABELS, {
      accessToken: cesiumIonAccessToken,
    }).catch(console.error),
  default_road: ({ cesiumIonAccessToken } = {}) =>
    IonImageryProvider.fromAssetId(IonWorldImageryStyle.ROAD, {
      accessToken: cesiumIonAccessToken,
    }).catch(console.error),
  open_street_map: () =>
    new OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org/{zoom}/{x}/{y}.png",
      credit:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }),
  black_marble: ({ cesiumIonAccessToken } = {}) =>
    IonImageryProvider.fromAssetId(3812, {
      accessToken: cesiumIonAccessToken,
    }).catch(console.error),
  japan_gsi_standard: () =>
    new OpenStreetMapImageryProvider({
      url: "https://cyberjapandata.gsi.go.jp/xyz/std/",
      credit:
        "<a href='https://maps.gsi.go.jp/development/ichiran.html'>国土地理院</a>, Shoreline data is derived from: United States. National Imagery and Mapping Agency. \"Vector Map Level 0 (VMAP0).\" Bethesda, MD: Denver, CO: The Agency; USGS Information Services, 1997.",
    }),
  url: ({ url, heatmap, tile_zoomLevel } = {}) =>
    url
      ? new UrlTemplateImageryProvider({
          url,
          tileDiscardPolicy: heatmap
            ? new DiscardEmptyTileImagePolicy()
            : undefined,
          minimumLevel: tile_zoomLevel?.[0],
          maximumLevel: tile_zoomLevel?.[1],
        })
      : null,
} as {
  [key: string]: (opts?: {
    url?: string;
    cesiumIonAccessToken?: string;
    heatmap?: boolean;
    tile_zoomLevel?: number[];
  }) => Promise<ImageryProvider> | ImageryProvider | null;
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
