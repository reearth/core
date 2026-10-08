import { isEqual } from "lodash-es";
import { memo } from "react";

import { extractSimpleLayer, type FeatureComponentConfig } from "../utils";

import { useMVT } from "./mvt";
import { useTiles } from "./tiles";
import { useTMS } from "./tms";
import type { Props } from "./types";
import { useWMS } from "./wms";

function Raster({ isVisible, layer, property }: Props) {
  useWMS({ isVisible, layer, property });
  useTiles({ isVisible, layer, property });
  useTMS({ isVisible, layer, property });
  useMVT({ isVisible, layer, property });

  return null;
}

export default memo(
  Raster,
  (prev, next) => {
    // In Raster component, we only use polygon, polyline and marker, so we only check polygon in layer props.
    const p = extractSimpleLayer(prev.layer);
    const n = extractSimpleLayer(next.layer);
    return (
      isEqual(p?.polygon, n?.polygon) &&
      isEqual(p?.polyline, n?.polyline) &&
      isEqual(p?.marker, n?.marker) &&
      isEqual(p?.data, n?.data) &&
      isEqual(prev.property, next.property) &&
      prev.isVisible === next.isVisible &&
      prev.evalFeature === next.evalFeature &&
      prev.onComputedFeatureFetch === next.onComputedFeatureFetch
    );
  },
);

export const config: FeatureComponentConfig = {
  noFeature: true,
};
