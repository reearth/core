import { type Globe as CesiumGlobeType } from "cesium";
import { useEffect, useMemo, useRef, type JSX } from "react";
import { Globe as CesiumGlobe, type CesiumComponentRef } from "resium";

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

  // Direct ref to the underlying Cesium Globe object.
  // Resium's Globe.update() is skipped on initial mount when C.current=false
  // (a Resium timing issue). This effect guarantees globe.terrainProvider is
  // always applied once the Promise resolves, regardless of prop-change timing.
  const cesiumGlobeRef = useRef<CesiumComponentRef<CesiumGlobeType>>(null);
  useEffect(() => {
    let cancelled = false;
    providerPromise
      .then(resolvedProvider => {
        if (cancelled) return;
        const cesiumGlobe = cesiumGlobeRef.current?.cesiumElement;
        if (cesiumGlobe) {
          cesiumGlobe.terrainProvider = resolvedProvider;
        }
      })
      .catch(() => {
        // provider errors are handled by the existing useEffect below
      });
    return () => {
      cancelled = true;
    };
  }, [providerPromise]);

  const lastResolvedProviderRef = useRef<any>(null);
  useEffect(() => {
    let isCancelled = false;

    providerPromise
      .then(resolvedProvider => {
        if (isCancelled) return;
        if (lastResolvedProviderRef.current !== resolvedProvider) {
          lastResolvedProviderRef.current = resolvedProvider;
          onTerrainProviderChange?.();
        }
      })
      .catch(error => {
        if (!isCancelled) console.warn("Terrain provider failed to load:", error);
      });

    return () => {
      isCancelled = true;
    };
  }, [providerPromise, onTerrainProviderChange]);

  return (
    <CesiumGlobe
      ref={cesiumGlobeRef}
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
