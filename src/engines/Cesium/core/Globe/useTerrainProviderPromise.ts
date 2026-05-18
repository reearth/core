import {
  ArcGISTiledElevationTerrainProvider,
  CesiumTerrainProvider,
  EllipsoidTerrainProvider,
  IonResource,
  TerrainProvider,
} from "cesium";
import { useMemo, useRef } from "react";

import { TerrainProperty } from "../../..";
import { AssetsCesiumProperty, TileProviderConfig } from "../../../../Map";
import { resolveTerrainUrl } from "../tileProviderResolver";

// Extended terrain types to include 'reearth'
type TerrainType = NonNullable<TerrainProperty["type"]> | "reearth";

type ProviderOpts = Pick<TerrainProperty, "normal"> &
  AssetsCesiumProperty["terrain"] & {
    terrain?: boolean;
    terrainType?: TerrainType | null | undefined;
    ionAccessToken?: string | undefined;
    /** Reearth terrain URL (for type='reearth') */
    reearthTerrainUrl?: string | undefined;
    /** TileProviderConfig for provider-agnostic configuration */
    tileProvider?: TileProviderConfig | undefined;
  };

export default function useTerrainProviderPromise(opts: ProviderOpts) {
  // Cache promises so we don't recreate providers on every toggle
  const cacheRef = useRef(new Map<string, Promise<TerrainProvider>>());
  const ellipsoidRef = useRef<TerrainProvider>(undefined);

  return useMemo<Promise<TerrainProvider>>(() => {
    if (!opts.terrain) {
      // single shared ellipsoid provider
      if (!ellipsoidRef.current)
        ellipsoidRef.current = new EllipsoidTerrainProvider();
      return Promise.resolve(ellipsoidRef.current);
    }

    const kind = (opts.terrainType ?? "cesium") as TerrainType;
    const key = makeKey(kind, opts);
    let p = cacheRef.current.get(key);
    if (!p) {
      p = createProvider(kind, opts);
      cacheRef.current.set(key, p);
    }
    return p;
  }, [opts]);
}

function makeKey(type: TerrainType, opts: ProviderOpts) {
  const asset = opts.ionAsset ?? "";
  const url = opts.ionUrl ?? "";
  const reearthTerrainUrl = opts.reearthTerrainUrl ?? resolveTerrainUrl(opts.tileProvider) ?? "";
  const ionToken = opts.ionAccessToken ?? "";
  const normal = String(!!opts.normal);
  return `${type}|asset:${asset}|url:${url}|reearth:${reearthTerrainUrl}|ion:${ionToken}|normal:${normal}`;
}

function createProvider(type: TerrainType, opts: ProviderOpts): Promise<TerrainProvider> {
  // First, try to use TileProviderConfig if available
  const tileProviderUrl = resolveTerrainUrl(opts.tileProvider);

  switch (type) {
    case "reearth": {
      // Explicit Reearth terrain — must have a URL configured.
      const terrainUrl = opts.reearthTerrainUrl ?? tileProviderUrl;
      if (terrainUrl) {
        return CesiumTerrainProvider.fromUrl(terrainUrl, {
          requestVertexNormals: !!opts.normal,
          requestWaterMask: false,
        }) as Promise<TerrainProvider>;
      }
      console.warn(
        "[Terrain] type='reearth' requires tileProvider.terrainOverrides to be configured. " +
          "Falling back to ellipsoid.",
      );
      return Promise.resolve(new EllipsoidTerrainProvider());
    }

    case "cesium": {
      // "cesium" preserves its original meaning: CesiumWorld Terrain (Ion Asset 1).
      // If a tileProvider URL is configured it takes precedence — this allows reearth terrain
      // deployments to upgrade without requiring a scene-data migration from "cesium" → "reearth".
      const terrainUrl = opts.reearthTerrainUrl ?? tileProviderUrl;
      if (terrainUrl) {
        return CesiumTerrainProvider.fromUrl(terrainUrl, {
          requestVertexNormals: !!opts.normal,
          requestWaterMask: false,
        }) as Promise<TerrainProvider>;
      }
      // Legacy: fall back to CesiumWorld Terrain via Ion.
      return CesiumTerrainProvider.fromUrl(
        IonResource.fromAssetId(1, { accessToken: opts.ionAccessToken }),
        { requestVertexNormals: !!opts.normal, requestWaterMask: false },
      ) as Promise<TerrainProvider>;
    }

    case "arcgis":
      return ArcGISTiledElevationTerrainProvider.fromUrl(
        "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
      ) as Promise<TerrainProvider>;

    case "cesiumion": {
      if (!opts.ionAsset && !opts.ionUrl) {
        return Promise.resolve(new EllipsoidTerrainProvider());
      }
      return CesiumTerrainProvider.fromUrl(
        opts.ionUrl ??
          IonResource.fromAssetId(parseInt(String(opts.ionAsset), 10), {
            accessToken: opts.ionAccessToken,
          }),
        { requestVertexNormals: !!opts.normal },
      ) as Promise<TerrainProvider>;
    }

    default:
      // Unknown type, return ellipsoid
      return Promise.resolve(new EllipsoidTerrainProvider());
  }
}
