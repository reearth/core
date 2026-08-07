import {
  CesiumTerrainProvider,
  EllipsoidTerrainProvider,
  IonResource,
  TerrainProvider,
} from "cesium";
import { useMemo, useRef } from "react";

import { TerrainProperty } from "../../..";
import { AssetsCesiumProperty } from "../../../../Map";

type TerrainType = NonNullable<TerrainProperty["type"]>;

const REEARTH_TERRAIN_URL = "https://terrain.reearth.land/cesium-mesh/ellipsoid";

type ProviderOpts = Pick<TerrainProperty, "normal" | "waterMask"> &
  AssetsCesiumProperty["terrain"] & {
    terrain?: boolean;
    terrainType?: TerrainType | null | undefined;
    ionAccessToken?: string | undefined;
  };

export default function useTerrainProviderPromise(opts: ProviderOpts) {
  const cacheRef = useRef(new Map<string, Promise<TerrainProvider>>());
  const ellipsoidRef = useRef<TerrainProvider>(undefined);

  return useMemo<Promise<TerrainProvider>>(() => {
    if (!opts.terrain) {
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
  const asset = opts.ionAsset ?? "";
  const url = opts.ionUrl ?? "";
  const ionToken = opts.ionAccessToken ?? "";
  const normal = String(!!opts.normal);
  const wm = String(opts.waterMask ?? true);
  return `${type}|asset:${asset}|url:${url}|ion:${ionToken}|normal:${normal}|wm:${wm}`;
}

function createProvider(type: TerrainType, opts: ProviderOpts): Promise<TerrainProvider> {
  switch (type) {
    case "reearth_terrain":
      return CesiumTerrainProvider.fromUrl(REEARTH_TERRAIN_URL, {
        requestVertexNormals: !!opts.normal,
        requestWaterMask: opts.waterMask ?? true,
      }) as Promise<TerrainProvider>;

    case "cesium": {
      return CesiumTerrainProvider.fromUrl(
        IonResource.fromAssetId(1, { accessToken: opts.ionAccessToken }),
        { requestVertexNormals: !!opts.normal, requestWaterMask: opts.waterMask ?? true },
      ) as Promise<TerrainProvider>;
    }

    case "cesiumion": {
      if (!opts.ionAsset && !opts.ionUrl) return Promise.resolve(new EllipsoidTerrainProvider());
      return CesiumTerrainProvider.fromUrl(
        opts.ionUrl ??
          IonResource.fromAssetId(parseInt(String(opts.ionAsset), 10), {
            accessToken: opts.ionAccessToken,
          }),
        { requestVertexNormals: !!opts.normal, requestWaterMask: opts.waterMask ?? true },
      ) as Promise<TerrainProvider>;
    }

    default:
      return Promise.resolve(new EllipsoidTerrainProvider());
  }
}
