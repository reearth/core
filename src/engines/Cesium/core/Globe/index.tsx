import { useEffect, useMemo, useRef } from "react";
import { Globe as CesiumGlobe } from "resium";

import type { ViewerProperty } from "../../..";
import { toColor } from "../../common";

import useTerrainProviderPromise from "./useTerrainProviderPromise";

export type Props = {
  property?: ViewerProperty;
  cesiumIonAccessToken?: string;
  onTerrainProviderChange?: () => void;
};

export default function Globe({
  property,
  cesiumIonAccessToken,
  onTerrainProviderChange,
}: Props): JSX.Element | null {
  const providerPromise = useTerrainProviderPromise({
    terrain: property?.terrain?.enabled,
    terrainType: property?.terrain?.type,
    normal: property?.terrain?.normal,
    ionAccessToken: property?.assets?.cesium?.terrain?.ionAccessToken || cesiumIonAccessToken,
    ionAsset: property?.assets?.cesium?.terrain?.ionAsset,
    ionUrl: property?.assets?.cesium?.terrain?.ionUrl,
  });

  const baseColor = useMemo(
    () => toColor(property?.globe?.baseColor),
    [property?.globe?.baseColor],
  );

  const lastResolvedProviderRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    providerPromise
      .then(resolvedProvider => {
        if (isCancelled) return;

        // Only trigger callback if the resolved provider is actually different
        if (lastResolvedProviderRef.current !== resolvedProvider) {
          lastResolvedProviderRef.current = resolvedProvider;
          onTerrainProviderChange?.();
        }
      })
      .catch(error => {
        if (!isCancelled) {
          console.warn("Terrain provider failed to load:", error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [providerPromise, onTerrainProviderChange]);

  return (
    <CesiumGlobe
      baseColor={baseColor}
      enableLighting={!!property?.globe?.enableLighting}
      showGroundAtmosphere={property?.globe?.atmosphere?.enabled ?? true}
      atmosphereLightIntensity={property?.globe?.atmosphere?.lightIntensity}
      atmosphereSaturationShift={property?.globe?.atmosphere?.saturationShift}
      atmosphereHueShift={property?.globe?.atmosphere?.hueShift}
      atmosphereBrightnessShift={property?.globe?.atmosphere?.brightnessShift}
      terrainProvider={providerPromise}
      depthTestAgainstTerrain={!!property?.globe?.depthTestAgainstTerrain}
    />
  );
}
