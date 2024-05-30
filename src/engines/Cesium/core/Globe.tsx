import {
  ArcGISTiledElevationTerrainProvider,
  CesiumTerrainProvider,
  EllipsoidTerrainProvider,
  IonResource,
  TerrainProvider,
} from "cesium";
import { useMemo } from "react";
import { Globe as CesiumGlobe } from "resium";

import type { SceneProperty, TerrainProperty } from "../..";
import { toColor } from "../common";

export type Props = {
  property?: SceneProperty;
  cesiumIonAccessToken?: string;
};

export default function Globe({ property, cesiumIonAccessToken }: Props): JSX.Element | null {
  const terrainProperty = useMemo(
    (): TerrainProperty => ({
      ...property?.terrain,
    }),
    [property?.terrain],
  );

  const terrainProvider = useMemo((): Promise<TerrainProvider> | TerrainProvider | undefined => {
    const opts = {
      terrain: terrainProperty?.terrain,
      terrainType: terrainProperty?.terrainType,
      terrainNormal: terrainProperty?.terrainNormal,
      terrainCesiumIonAccessToken:
        terrainProperty?.terrainCesiumIonAccessToken || cesiumIonAccessToken,
      terrainCesiumIonAsset: terrainProperty?.terrainCesiumIonAsset,
      terrainCesiumIonUrl: terrainProperty?.terrainCesiumIonUrl,
    };
    const provider = opts.terrain ? terrainProviders[opts.terrainType || "cesium"] : undefined;
    return (typeof provider === "function" ? provider(opts) : provider) ?? defaultTerrainProvider;
  }, [
    terrainProperty?.terrain,
    terrainProperty?.terrainType,
    terrainProperty?.terrainCesiumIonAccessToken,
    terrainProperty?.terrainCesiumIonAsset,
    terrainProperty?.terrainCesiumIonUrl,
    terrainProperty?.terrainNormal,
    cesiumIonAccessToken,
  ]);

  const baseColor = useMemo(
    () => toColor(property?.globe?.baseColor),
    [property?.globe?.baseColor],
  );

  return (
    <CesiumGlobe
      baseColor={baseColor}
      enableLighting={!!property?.globe?.enableLighting}
      showGroundAtmosphere={property?.globe?.showGroundAtmosphere ?? true}
      atmosphereLightIntensity={property?.globe?.atmosphereLightIntensity}
      atmosphereSaturationShift={property?.globe?.atmosphereSaturationShift}
      atmosphereHueShift={property?.globe?.atmosphereHueShift}
      atmosphereBrightnessShift={property?.globe?.atmosphereBrightnessShift}
      terrainProvider={terrainProvider}
      depthTestAgainstTerrain={!!property?.globe?.depthTestAgainstTerrain}
    />
  );
}

const defaultTerrainProvider = new EllipsoidTerrainProvider();

const terrainProviders: {
  [k in NonNullable<TerrainProperty["terrainType"]>]:
    | TerrainProvider
    | ((
        opts: Pick<
          TerrainProperty,
          | "terrainCesiumIonAccessToken"
          | "terrainCesiumIonAsset"
          | "terrainCesiumIonUrl"
          | "terrainNormal"
        >,
      ) => Promise<TerrainProvider> | TerrainProvider | null);
} = {
  cesium: ({ terrainCesiumIonAccessToken, terrainNormal }) =>
    CesiumTerrainProvider.fromUrl(
      IonResource.fromAssetId(1, {
        accessToken: terrainCesiumIonAccessToken,
      }),
      {
        requestVertexNormals: terrainNormal,
        requestWaterMask: false,
      },
    ),
  arcgis: () =>
    ArcGISTiledElevationTerrainProvider.fromUrl(
      "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
    ),
  cesiumion: ({
    terrainCesiumIonAccessToken,
    terrainCesiumIonAsset,
    terrainCesiumIonUrl,
    terrainNormal,
  }) =>
    terrainCesiumIonAsset
      ? CesiumTerrainProvider.fromUrl(
          terrainCesiumIonUrl ||
            IonResource.fromAssetId(parseInt(terrainCesiumIonAsset, 10), {
              accessToken: terrainCesiumIonAccessToken,
            }),
          {
            requestVertexNormals: terrainNormal,
          },
        )
      : null,
};
