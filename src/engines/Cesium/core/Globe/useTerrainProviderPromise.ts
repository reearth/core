import {
  ArcGISTiledElevationTerrainProvider,
  CesiumTerrainProvider,
  EllipsoidTerrainProvider,
  IonResource,
  TerrainProvider,
} from "cesium";
import { useMemo, useRef } from "react";

import { TerrainProperty } from "../../..";
import { AssetsCesiumProperty } from "../../../../Map";

type TerrainType = NonNullable<TerrainProperty["type"]>;

type ProviderOpts = Pick<TerrainProperty, "normal"> &
  AssetsCesiumProperty["terrain"] & {
    terrain?: boolean;
    terrainType?: TerrainType | null | undefined;
    ionAccessToken?: string | undefined;
  };

export default function useTerrainProviderPromise(opts: ProviderOpts) {
  // Cache promises so we don’t recreate providers on every toggle
  const cacheRef = useRef(new Map<string, Promise<TerrainProvider>>());
  const ellipsoidRef = useRef<TerrainProvider>();

  return useMemo<Promise<TerrainProvider>>(() => {
    if (!opts.terrain) {
      // single shared ellipsoid provider
      if (!ellipsoidRef.current) ellipsoidRef.current = new EllipsoidTerrainProvider();
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
  // Key should change when output provider would differ
  const asset = opts.ionAsset ?? "";
  const url = opts.ionUrl ?? "";
  const normal = String(!!opts.normal);
  return `${type}|asset:${asset}|url:${url}|normal:${normal}`;
}

function createProvider(type: TerrainType, opts: ProviderOpts): Promise<TerrainProvider> {
  switch (type) {
    case "cesium":
      return CesiumTerrainProvider.fromUrl(
        IonResource.fromAssetId(1, { accessToken: opts.ionAccessToken }),
        { requestVertexNormals: !!opts.normal, requestWaterMask: false },
      ) as Promise<TerrainProvider>;

    case "arcgis":
      return ArcGISTiledElevationTerrainProvider.fromUrl(
        "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
      ) as Promise<TerrainProvider>;

    case "cesiumion":
      if (!opts.ionAsset && !opts.ionUrl) {
        // Fallback to ellipsoid when misconfigured
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
}
