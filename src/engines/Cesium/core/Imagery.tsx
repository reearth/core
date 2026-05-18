import {
  Color,
  ImageryLayer as CesiumImageryLayer,
  ImageryProvider,
  TextureMagnificationFilter,
  TextureMinificationFilter,
} from "cesium";
import { isEqual } from "lodash-es";
import { useCallback, useMemo, useRef, useEffect } from "react";
import { useCesium } from "resium";

import type { TileProviderConfig } from "../../../Map/types/tileProvider";

import { isValidPresetTileType, PresetTileType, tiles as tilePresets } from "./presets";

export type ImageryLayerData = {
  id: string;
  provider: ImageryProvider;
  min?: number;
  max?: number;
  opacity?: number;
};

export type Tile = {
  id: string;
  url?: string;
  type?: string;
  opacity?: number;
  zoomLevel?: number[];
  zoomLevelForURL?: number[];
  heatmap?: boolean;
};

export type Props = {
  tiles?: Tile[];
  cesiumIonAccessToken?: string;
  tileProvider?: TileProviderConfig;
  onTilesChange?: () => void;
};

// NOTE: This component intentionally bypasses Resium's declarative <ImageryLayer />.
// Resium wraps provider creation in queueMicrotask; under React 18 Strict Mode the effect
// cleanup runs before that microtask resolves, so the layer reference is undefined at cleanup
// time and old layers are never removed — they accumulate silently behind new ones.
// Direct imageryLayerCollection management with a `cancelled` flag is the only safe fix.
export default function ImageryLayers({
  tiles,
  cesiumIonAccessToken,
  tileProvider,
  onTilesChange,
}: Props) {
  const { imageryLayerCollection, scene } = useCesium();

  const { providers } = useImageryProviders({
    tiles,
    cesiumIonAccessToken,
    tileProvider,
    presets: tilePresets,
  });

  useEffect(() => {
    if (!imageryLayerCollection || !scene) return;

    let cancelled = false;
    const addedLayers: CesiumImageryLayer[] = [];

    tiles?.forEach(({ id, zoomLevel, opacity, heatmap }, i) => {
      const providerOrPromise = providers[id]?.[2];
      if (!providerOrPromise) return;

      const doAdd = (provider: ImageryProvider) => {
        if (cancelled || scene.isDestroyed()) return;
        const layer = new CesiumImageryLayer(provider, {
          minimumTerrainLevel: zoomLevel?.[0],
          maximumTerrainLevel: zoomLevel?.[1],
          alpha: opacity,
          colorToAlpha: heatmap ? Color.WHITE : undefined,
          colorToAlphaThreshold: heatmap ? 1 : undefined,
          magnificationFilter: heatmap ? TextureMagnificationFilter.LINEAR : undefined,
          minificationFilter: heatmap ? TextureMinificationFilter.NEAREST : undefined,
        });
        imageryLayerCollection.add(layer, i);
        addedLayers.push(layer);
        scene.requestRender();
      };

      if (providerOrPromise instanceof Promise) {
        providerOrPromise.then(doAdd);
      } else {
        doAdd(providerOrPromise as ImageryProvider);
      }
    });

    scene.requestRender();
    onTilesChange?.();

    return () => {
      cancelled = true;
      for (const layer of addedLayers) {
        if (!scene.isDestroyed() && imageryLayerCollection.contains(layer)) {
          imageryLayerCollection.remove(layer);
        }
      }
    };
  }, [providers, tiles, imageryLayerCollection, scene, onTilesChange]);

  return null;
}

type Providers = { [id: string]: [string | undefined, string | undefined, ImageryProvider] };

export function useImageryProviders({
  tiles = [],
  cesiumIonAccessToken,
  tileProvider,
  presets,
}: {
  tiles?: Tile[];
  cesiumIonAccessToken?: string;
  tileProvider?: TileProviderConfig;
  presets: {
    [K in PresetTileType]: (opts?: {
      url?: string;
      cesiumIonAccessToken?: string;
      heatmap?: boolean;
      zoomLevel?: number[];
      tileProvider?: TileProviderConfig;
    }) => Promise<ImageryProvider> | ImageryProvider | null;
  };
}): { providers: Providers; updated: boolean } {
  const newTile = useCallback(
    (t: Tile, ciat?: string, tp?: TileProviderConfig) => {
      return presets[isValidPresetTileType(t.type) ? t.type : "default"]({
        url: t.url,
        cesiumIonAccessToken: ciat,
        heatmap: t.heatmap,
        zoomLevel: t.zoomLevelForURL,
        tileProvider: tp,
      });
    },
    [presets],
  );

  const prevCesiumIonAccessToken = useRef(cesiumIonAccessToken);
  const prevTileProvider = useRef(tileProvider);
  const tileKeys = tiles.map(t => t.id).join(",");
  const prevTileKeys = useRef(tileKeys);
  const prevProviders = useRef<Providers>({});
  const zoomLevels = useMemo(
    () =>
      tiles.map(t => {
        if (t.id && t.zoomLevel) return { [t.id]: t.zoomLevel };
        return;
      }),
    [tiles],
  );
  const prevZoomLevels = useRef(zoomLevels);

  // Manage TileProviders so that TileProvider does not need to be recreated each time tiles are updated.
  const { providers, updated } = useMemo(() => {
    const isCesiumAccessTokenUpdated = prevCesiumIonAccessToken.current !== cesiumIonAccessToken;
    const isTileProviderUpdated = prevTileProvider.current !== tileProvider;
    const prevProvidersKeys = Object.keys(prevProviders.current);
    const added = tiles.map(t => t.id).filter(t => t && !prevProvidersKeys.includes(t));

    const rawProviders = [
      ...Object.entries(prevProviders.current),
      ...added.map(a => [a, undefined] as const),
    ].map(([k, v]) => ({
      key: k,
      added: added.includes(k),
      prevType: v?.[0],
      prevUrl: v?.[1],
      prevProvider: v?.[2],
      tile: tiles.find(t => t.id === k),
    }));

    const providers = Object.fromEntries(
      rawProviders
        .map(
          ({
            key,
            added,
            prevType,
            prevUrl,
            prevProvider,
            tile,
          }):
            | [
                string,
                [
                  string | undefined,
                  string | undefined,
                  Promise<ImageryProvider> | ImageryProvider | null | undefined,
                ],
              ]
            | null =>
            !tile
              ? null
              : [
                  key,
                  added ||
                  prevType !== tile.type ||
                  prevUrl !== tile.url ||
                  isTileProviderUpdated ||
                  (isCesiumAccessTokenUpdated && (!tile.type || tile.type === "default"))
                    ? [tile.type, tile.url, newTile(tile, cesiumIonAccessToken, tileProvider)]
                    : [prevType, prevUrl, prevProvider],
                ],
        )
        .filter(
          (e): e is [string, [string | undefined, string | undefined, ImageryProvider]] =>
            !!e?.[1][2],
        ),
    );

    const updated =
      !!added.length ||
      !!isCesiumAccessTokenUpdated ||
      !!isTileProviderUpdated ||
      !isEqual(prevTileKeys.current, tileKeys) ||
      !isEqual(prevZoomLevels.current, zoomLevels) ||
      rawProviders.some(p => p.tile && (p.prevType !== p.tile.type || p.prevUrl !== p.tile.url));

    prevTileKeys.current = tileKeys;
    prevZoomLevels.current = zoomLevels;
    prevCesiumIonAccessToken.current = cesiumIonAccessToken;
    prevTileProvider.current = tileProvider;

    return { providers, updated };
  }, [cesiumIonAccessToken, tileProvider, tiles, tileKeys, newTile, zoomLevels]);

  prevProviders.current = providers;
  return { providers, updated };
}
