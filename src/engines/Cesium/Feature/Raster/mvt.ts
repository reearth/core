import { cloneDeep, isEqual } from "lodash-es";
import { useMemo, useRef } from "react";

import { MVTImageryProvider } from "@reearth/cesium-mvt-imagery-provider";

import type { LayerSimple } from "../../../../mantle";
import { extractSimpleLayer } from "../utils";

import { useData, useImageryProvider } from "./hooks";
import type { Props } from "./types";
import { normalizeUrl } from "./utils";

export const useMVT = ({
  isVisible,
  property,
  layer,
}: Pick<Props, "isVisible" | "property" | "layer">) => {
  const { show = true, minimumLevel, maximumLevel, credit } = property ?? {};
  const { type, url, layers } = useData(layer);

  const rawLayer = extractSimpleLayer(layer);
  // Proxy-strip (required by MVTImageryProvider) and stabilize the reference
  // so useMemo only recomputes when layer content actually changes.
  const currentLayerRef = useRef<LayerSimple | undefined>(undefined);
  if (!rawLayer) {
    currentLayerRef.current = undefined;
  } else if (!isEqual(currentLayerRef.current, rawLayer)) {
    currentLayerRef.current = cloneDeep(rawLayer);
  }
  const currentLayer = currentLayerRef.current;
  const imageryProvider = useMemo(() => {
    if (!isVisible || !show || !url || !layers || type !== "mvt") return;
    return new MVTImageryProvider({
      minimumLevel,
      maximumLevel,
      credit,
      urlTemplate: normalizeUrl(url, "mvt") as `http${"s" | ""}://${string}/{z}/{x}/{y}${string}`,
      layerName: layers,
      layer: currentLayer,
      worker: true,
    });
  }, [isVisible, show, url, layers, type, minimumLevel, maximumLevel, credit, currentLayer]);

  useImageryProvider(imageryProvider, layer?.id, property);
};
