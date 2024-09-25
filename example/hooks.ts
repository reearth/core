import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ComputedFeature,
  LazyLayer,
  MapRef,
  SketchEditingFeature,
  SketchType,
  ViewerProperty,
} from "@reearth/core";

import { DEFAULT_CAMERA, DEFAULT_LAYERS, DEFAULT_TILE } from "./constants";
import { VIEWER } from "./scene";
import { TEST_LAYERS } from "./testLayers";
import { CESIUM_ION_ACCESS_TOKEN } from "./token";

export default () => {
  const ref = useRef<MapRef>(null);
  const [isReady, setIsReady] = useState(false);
  const handleMount = useCallback(() => {
    requestAnimationFrame(() => {
      setIsReady(true);
    });
  }, []);

  const handleAPIReady = useCallback(() => {
    ref.current?.sketch.overrideOptions({
      dataOnly: false,
    });
    ref.current?.sketch.onEditFeatureChange(setSketchEditingFeatrue);
  }, []);

  // TODO: use onLayerSelect props (core should export a type for selection).
  const [selectedLayer, setSelectedLayer] = useState<LazyLayer | undefined>();
  const [selectedFeature, setSelectedFeature] = useState<ComputedFeature | undefined>();
  const handleSelect = useCallback(() => {
    setSelectedLayer(ref.current?.layers.selectedLayer());
    setSelectedFeature(ref.current?.layers.selectedFeature());
  }, []);

  const meta = useMemo(
    () => ({
      cesiumIonAccessToken: CESIUM_ION_ACCESS_TOKEN || undefined,
    }),
    [],
  );

  const [currentTile, setCurrentTile] = useState(DEFAULT_TILE);
  const [currentCamera, setCurrentCamera] = useState(DEFAULT_CAMERA);
  const [terrainEnabled, setTerrainEnabled] = useState(true);
  const [hideUnderground, setHideUnderground] = useState(false);
  const [activeLayerIds, setActiveLayerIds] = useState<string[]>(DEFAULT_LAYERS);

  const viewerProperty: ViewerProperty = useMemo(
    () => ({
      ...VIEWER,
      tiles: [
        {
          id: "asdflajslf",
          type: currentTile,
          opacity: 1,
        },
      ],
      terrain: {
        ...VIEWER.terrain,
        enabled: terrainEnabled,
      },
      globe: {
        depthTestAgainstTerrain: hideUnderground,
      },
    }),
    [currentTile, terrainEnabled, hideUnderground],
  );

  const layers = useMemo(
    () => TEST_LAYERS.filter(layer => activeLayerIds.includes(layer.id)),
    [activeLayerIds],
  );

  const [sketchTool, setSketchTool] = useState<SketchType | undefined>(undefined);
  useEffect(() => {
    ref.current?.sketch?.setType(sketchTool);
  }, [ref, sketchTool]);

  const sketchFeatureSelected = useMemo(
    () =>
      !!(
        !!selectedFeature &&
        selectedLayer?.type === "simple" &&
        selectedLayer.data?.isSketchLayer
      ),
    [selectedLayer, selectedFeature],
  );

  const [sketchEditingFeature, setSketchEditingFeatrue] = useState<
    SketchEditingFeature | undefined
  >();

  const handleEditSketchFeature = useCallback(() => {
    if (
      !(selectedLayer?.type === "simple" && selectedLayer.data?.isSketchLayer) ||
      !selectedLayer.id ||
      !selectedFeature?.id
    )
      return;
    ref.current?.sketch.editFeature({ layerId: selectedLayer.id, feature: selectedFeature });
  }, [selectedLayer, selectedFeature]);

  const handleCancelEditSketchFeature = useCallback(() => {
    ref.current?.sketch.cancelEdit();
  }, []);

  const handleApplyEditSketchFeature = useCallback(() => {
    ref.current?.sketch.applyEdit();
  }, []);

  const handleDeleteSketchFeature = useCallback(() => {
    if (
      !(selectedLayer?.type === "simple" && selectedLayer.data?.isSketchLayer) ||
      !selectedLayer.id ||
      !selectedFeature?.id
    )
      return;
    ref.current?.sketch.deleteFeature(selectedLayer.id, selectedFeature.id);
  }, [selectedLayer, selectedFeature]);

  return {
    isReady,
    ref,
    handleMount,
    handleAPIReady,
    handleSelect,
    meta,
    currentTile,
    setCurrentTile,
    currentCamera,
    setCurrentCamera,
    terrainEnabled,
    setTerrainEnabled,
    hideUnderground,
    setHideUnderground,
    activeLayerIds,
    setActiveLayerIds,
    viewerProperty,
    layers,
    sketchTool,
    setSketchTool,
    selectedLayer,
    selectedFeature,
    sketchEditingFeature,
    sketchFeatureSelected,
    handleEditSketchFeature,
    handleCancelEditSketchFeature,
    handleApplyEditSketchFeature,
    handleDeleteSketchFeature,
  };
};
