import {
  Color,
  ImageryLayer as CesiumImageryLayer,
  ImageryProvider,
  TextureMagnificationFilter,
  TextureMinificationFilter,
  UrlTemplateImageryProvider,
} from "cesium";
import { isEqual } from "lodash-es";
import { useCallback, useMemo, useRef, useEffect } from "react";
import { useCesium } from "resium";

import type { CustomProviderConfig } from "../../../Map/types/customProvider";

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
  cesiumIonAssetId?: number;
  opacity?: number;
  zoomLevel?: number[];
  zoomLevelForURL?: number[];
  heatmap?: boolean;
};

export type Props = {
  tiles?: Tile[];
  cesiumIonAccessToken?: string;
  customProvider?: CustomProviderConfig;
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
  customProvider,
  onTilesChange,
}: Props) {
  const { imageryLayerCollection, scene } = useCesium();

  const { providers } = useImageryProviders({
    tiles,
    cesiumIonAccessToken,
    customProvider,
    presets: tilePresets,
  });

  useEffect(() => {
    if (!imageryLayerCollection || !scene) return;

    let cancelled = false;
    const addedLayers: CesiumImageryLayer[] = [];

    tiles?.forEach(({ id, zoomLevel, opacity, heatmap }, i) => {
      const providerOrPromise = providers[id]?.[3];
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

type Providers = {
  [id: string]: [string | undefined, string | undefined, number | undefined, ImageryProvider];
};

export function useImageryProviders({
  tiles = [],
  cesiumIonAccessToken,
  customProvider,
  presets,
}: {
  tiles?: Tile[];
  cesiumIonAccessToken?: string;
  customProvider?: CustomProviderConfig;
  presets: {
    [K in PresetTileType]: (opts?: {
      url?: string;
      cesiumIonAccessToken?: string;
      heatmap?: boolean;
      zoomLevel?: number[];
    }) => Promise<ImageryProvider> | ImageryProvider | null;
  };
}): { providers: Providers; updated: boolean } {
  const newTile = useCallback(
    (t: Tile, ciat?: string, tp?: CustomProviderConfig) => {
      const opts = {
        url: t.url,
        cesiumIonAccessToken: ciat,
        cesiumIonAssetId: t.cesiumIonAssetId,
        heatmap: t.heatmap,
        zoomLevel: t.zoomLevelForURL,
      };
      if (isValidPresetTileType(t.type)) {
        return presets[t.type](opts);
      }
      // Dynamic: check customProvider.imagery.providers for a matching id
      const customEntry = tp?.imagery?.providers?.find(p => p.id === t.type);
      if (customEntry) {
        return new UrlTemplateImageryProvider({
          url: customEntry.url,
          credit: customEntry.credit,
          maximumLevel: customEntry.maximumLevel,
          minimumLevel: customEntry.minimumLevel,
        });
      }
      return presets["open_street_map"](opts);
    },
    [presets],
  );

  const prevCesiumIonAccessToken = useRef(cesiumIonAccessToken);
  const prevCustomProvider = useRef(customProvider);
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

  // Manage CustomProviders so that CustomProvider does not need to be recreated each time tiles are updated.
  const { providers, updated } = useMemo(() => {
    const isCesiumAccessTokenUpdated = prevCesiumIonAccessToken.current !== cesiumIonAccessToken;
    const isTileProviderUpdated = prevCustomProvider.current !== customProvider;
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
      prevIonAssetId: v?.[2],
      prevProvider: v?.[3],
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
            prevIonAssetId,
            prevProvider,
            tile,
          }):
            | [
                string,
                [
                  string | undefined,
                  string | undefined,
                  number | undefined,
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
                  prevIonAssetId !== tile.cesiumIonAssetId ||
                  isTileProviderUpdated ||
                  (isCesiumAccessTokenUpdated &&
                    (tile.type?.startsWith("cesium_ion") ||
                      tile.type === "default" ||
                      tile.type === "default_road" ||
                      tile.type === "default_label" ||
                      tile.type === "black_marble"))
                    ? [
                        tile.type,
                        tile.url,
                        tile.cesiumIonAssetId,
                        newTile(tile, cesiumIonAccessToken, customProvider),
                      ]
                    : [prevType, prevUrl, prevIonAssetId, prevProvider],
                ],
        )
        .filter(
          (
            e,
          ): e is [
            string,
            [string | undefined, string | undefined, number | undefined, ImageryProvider],
          ] => !!e?.[1][3],
        ),
    );

    const updated =
      !!added.length ||
      !!isCesiumAccessTokenUpdated ||
      !!isTileProviderUpdated ||
      !isEqual(prevTileKeys.current, tileKeys) ||
      !isEqual(prevZoomLevels.current, zoomLevels) ||
      rawProviders.some(
        p =>
          p.tile &&
          (p.prevType !== p.tile.type ||
            p.prevUrl !== p.tile.url ||
            p.prevIonAssetId !== p.tile.cesiumIonAssetId),
      );

    prevTileKeys.current = tileKeys;
    prevZoomLevels.current = zoomLevels;
    prevCesiumIonAccessToken.current = cesiumIonAccessToken;
    prevCustomProvider.current = customProvider;

    return { providers, updated };
  }, [cesiumIonAccessToken, customProvider, tiles, tileKeys, newTile, zoomLevels]);

  prevProviders.current = providers;
  return { providers, updated };
}
