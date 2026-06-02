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

  // Create a stable tiles reference that only changes when the content actually changes
  // Normalize `undefined` to a stable empty array so `useImageryProviders` doesn't allocate a new default `[]` each render.
  const emptyTiles = useMemo<Tile[]>(() => [], []);
  const tilesValue = tiles ?? emptyTiles;

  const prevTilesRef = useRef<Tile[]>(tilesValue);
  const stableTiles = useMemo(() => {
    if (!isEqual(prevTilesRef.current, tilesValue)) {
      prevTilesRef.current = tilesValue;
    }
    return prevTilesRef.current;
  }, [tilesValue]);

  // Pass stableTiles to useImageryProviders to prevent providers from being recreated
  // when tiles reference changes but content is the same
  const { providers } = useImageryProviders({
    tiles: stableTiles,
    cesiumIonAccessToken,
    customProvider,
    presets: tilePresets,
  });

  // Store layers keyed by tile ID to allow incremental updates
  const layersRef = useRef<
    Map<
      string,
      {
        layer: CesiumImageryLayer;
        tile: Tile;
        provider: Promise<ImageryProvider> | ImageryProvider;
      }
    >
  >(new Map());

  useEffect(() => {
    if (!imageryLayerCollection || !scene) return;

    let cancelled = false;
    const currentTileIds = new Set(stableTiles?.map(t => t.id) || []);

    // Remove layers for tiles that no longer exist
    layersRef.current.forEach(({ layer }, id) => {
      if (!currentTileIds.has(id)) {
        if (imageryLayerCollection.contains(layer)) {
          imageryLayerCollection.remove(layer);
        }
        layersRef.current.delete(id);
      }
    });

    // Track layers by their intended index to maintain order with async loading
    const layersByIndex: (CesiumImageryLayer | null)[] = new Array(stableTiles?.length || 0).fill(
      null,
    );

    const reorderLayers = () => {
      if (cancelled || scene.isDestroyed()) return;

      // Move each layer to its correct position based on layersByIndex
      layersByIndex.forEach((layer, targetIndex) => {
        if (!layer) return;

        const currentIndex = imageryLayerCollection.indexOf(layer);
        if (currentIndex === -1) return; // Layer not in collection

        // Calculate where this layer should be: count non-null layers before it
        const desiredIndex = layersByIndex.slice(0, targetIndex).filter(l => l !== null).length;

        if (currentIndex !== desiredIndex) {
          // Move layer to correct position
          imageryLayerCollection.remove(layer, false); // Don't destroy
          imageryLayerCollection.add(layer, desiredIndex);
        }
      });

      scene.requestRender();
    };

    stableTiles?.forEach((tile, i) => {
      const { id, zoomLevel, opacity, heatmap } = tile;
      const existing = layersRef.current.get(id);
      const providerOrPromise = providers[id]?.[3];

      if (!providerOrPromise) return;

      // Check if we can reuse the existing layer with just an opacity update
      if (existing) {
        const prevTile = existing.tile;
        const prevProvider = existing.provider;
        // Must check provider reference - if provider changed (e.g. cesiumIonAccessToken updated),
        // the layer needs to be recreated even if tile properties are the same
        const canReuseLayer =
          prevProvider === providerOrPromise &&
          prevTile.type === tile.type &&
          prevTile.url === tile.url &&
          prevTile.cesiumIonAssetId === tile.cesiumIonAssetId &&
          prevTile.zoomLevel?.[0] === zoomLevel?.[0] &&
          prevTile.zoomLevel?.[1] === zoomLevel?.[1] &&
          prevTile.heatmap === heatmap;

        if (canReuseLayer) {
          // Only opacity might have changed - update it directly if needed
          const nextAlpha = opacity ?? 1;
          if (existing.layer.alpha !== nextAlpha) {
            existing.layer.alpha = nextAlpha;
            scene.requestRender();
          }
          // Update stored tile and provider for next comparison
          existing.tile = tile;
          existing.provider = providerOrPromise;
          layersByIndex[i] = existing.layer;
          reorderLayers();
          return;
        }

        // Need to recreate the layer - remove the old one
        if (imageryLayerCollection.contains(existing.layer)) {
          imageryLayerCollection.remove(existing.layer);
        }
        layersRef.current.delete(id);
      }

      const doAdd = (provider: ImageryProvider) => {
        if (!provider || cancelled || scene.isDestroyed()) return;
        const layer = new CesiumImageryLayer(provider, {
          minimumTerrainLevel: zoomLevel?.[0],
          maximumTerrainLevel: zoomLevel?.[1],
          alpha: opacity,
          colorToAlpha: heatmap ? Color.WHITE : undefined,
          colorToAlphaThreshold: heatmap ? 1 : undefined,
          magnificationFilter: heatmap ? TextureMagnificationFilter.LINEAR : undefined,
          minificationFilter: heatmap ? TextureMinificationFilter.NEAREST : undefined,
        });

        // Always append to avoid index out of bounds
        imageryLayerCollection.add(layer);
        layersByIndex[i] = layer;
        // Store the provider reference to detect when provider changes (e.g. token update)
        layersRef.current.set(id, { layer, tile, provider: providerOrPromise });

        // Reorder all layers after each addition
        reorderLayers();
      };

      if (providerOrPromise instanceof Promise) {
        providerOrPromise
          .then(doAdd)
          .catch(err => console.error("Failed to load imagery provider:", err));
      } else {
        doAdd(providerOrPromise);
      }
    });

    scene.requestRender();
    onTilesChange?.();

    return () => {
      cancelled = true;
      // Don't remove layers on cleanup - they'll be managed by the next render
      // This prevents flickering when tiles change
    };
  }, [providers, stableTiles, imageryLayerCollection, scene, onTilesChange]);

  // Cleanup all layers on unmount
  useEffect(() => {
    const layers = layersRef.current;
    return () => {
      if (!imageryLayerCollection || !scene || scene.isDestroyed()) return;
      layers.forEach(({ layer }) => {
        if (imageryLayerCollection.contains(layer)) {
          imageryLayerCollection.remove(layer);
        }
      });
      layers.clear();
    };
  }, [imageryLayerCollection, scene]);

  return null;
}

type Providers = {
  [id: string]: [
    string | undefined,
    string | undefined,
    number | undefined,
    Promise<ImageryProvider> | ImageryProvider,
  ];
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
        tile_zoomLevel: t.zoomLevelForURL,
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
            [
              string | undefined,
              string | undefined,
              number | undefined,
              Promise<ImageryProvider> | ImageryProvider,
            ],
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
