import { forwardRef, useMemo, type Ref } from "react";

import { INTERACTION_MODES } from "../Visualizer/interactionMode";

import useHooks, { MapRef } from "./hooks";
import Layers, { type Props as LayersProps } from "./Layers";
import Sketch, { SketchProps } from "./Sketch";
import type { Engine, EngineProps } from "./types";

export * from "./types";
export { useGet, type WrappedRef, type Undefinable } from "./utils";

export type {
  NaiveLayer,
  LazyLayer,
  FeatureComponentType,
  FeatureComponentProps,
  ClusterProperty,
  Layer,
  LayerSelectionReason,
  Cluster,
  EvalFeature,
  DefaultInfobox,
  OverriddenLayer,
} from "./Layers";

export * from "./Sketch";
export type { TimelineCommitter, TimelineManagerRef } from "./useTimelineManager";

export type { MapRef } from "./hooks";

export type CursorType = "auto" | "grab" | "crosshair";

export type Props = {
  engines?: Record<string, Engine>;
  engine?: string;
  onAPIReady?: () => void;
} & Omit<
  LayersProps,
  | "Feature"
  | "clusterComponent"
  | "selectionReason"
  | "delegatedDataTypes"
  | "selectedLayerId"
  | "viewerProperty"
> &
  Omit<EngineProps, "onLayerSelect" | "layerSelectionReason" | "selectedLayerId"> &
  Omit<SketchProps, "layersRef" | "engineRef" | "SketchComponent"> & {
    cursor?: CursorType;
  };

function MapFn(
  {
    engines,
    engine,
    isBuilt,
    isEditable,
    clusters,
    hiddenLayers,
    layers,
    overrides,
    timelineManagerRef,
    interactionMode,
    selectedFeature,
    cursor,
    onLayerSelect,
    overrideInteractionMode,
    onSketchTypeChange,
    onSketchFeatureCreate,
    onSketchPluginFeatureCreate,
    onSketchFeatureUpdate,
    onSketchPluginFeatureUpdate,
    featureFlags = INTERACTION_MODES.default,
    onMount,
    onAPIReady,
    ...props
  }: Props,
  ref: Ref<MapRef>,
): JSX.Element | null {
  const currentEngine = engine ? engines?.[engine] : undefined;
  const Engine = currentEngine?.component;
  const {
    engineRef,
    layersRef,
    sketchRef,
    selectedLayer,
    requestingRenderMode,
    handleLayerSelect,
    handleEngineLayerSelect,
    sketchEditingFeature,
    setSketchEditingFeature,
    handleEngineMount,
    handleLayersMount,
    handleSketchMount,
  } = useHooks({
    ref,
    timelineManagerRef,
    cursor,
    onLayerSelect,
    onMount,
    onAPIReady,
  });

  const selectedLayerIds = useMemo(
    () => ({
      layerId: selectedLayer.layerId,
      featureId: selectedLayer.featureId,
    }),
    [selectedLayer.layerId, selectedLayer.featureId],
  );

  const selectedReason = useMemo(() => selectedLayer.reason, [selectedLayer.reason]);

  return Engine ? (
    <Engine
      ref={engineRef}
      isBuilt={isBuilt}
      isEditable={isEditable}
      selectedLayerId={selectedLayerIds}
      layerSelectionReason={selectedReason}
      layersRef={layersRef}
      requestingRenderMode={requestingRenderMode}
      timelineManagerRef={timelineManagerRef}
      onLayerSelect={handleEngineLayerSelect}
      featureFlags={featureFlags}
      onMount={handleEngineMount}
      {...props}>
      <Layers
        ref={layersRef}
        engineRef={engineRef}
        clusters={clusters}
        hiddenLayers={hiddenLayers}
        isBuilt={isBuilt}
        isEditable={isEditable}
        layers={layers}
        overrides={overrides}
        selectedLayer={selectedLayer}
        Feature={currentEngine?.featureComponent}
        clusterComponent={currentEngine?.clusterComponent}
        delegatedDataTypes={currentEngine.delegatedDataTypes}
        meta={props.meta}
        viewerProperty={props.property}
        requestingRenderMode={requestingRenderMode}
        sketchEditingFeature={sketchEditingFeature}
        onLayerSelect={handleLayerSelect}
        onMount={handleLayersMount}
      />
      <Sketch
        ref={sketchRef}
        layersRef={layersRef}
        engineRef={engineRef}
        interactionMode={interactionMode}
        selectedFeature={selectedFeature}
        SketchComponent={currentEngine?.sketchComponent}
        onLayerSelect={handleLayerSelect}
        overrideInteractionMode={overrideInteractionMode}
        onSketchTypeChange={onSketchTypeChange}
        onSketchFeatureCreate={onSketchFeatureCreate}
        onSketchPluginFeatureCreate={onSketchPluginFeatureCreate}
        onSketchFeatureUpdate={onSketchFeatureUpdate}
        onSketchPluginFeatureUpdate={onSketchPluginFeatureUpdate}
        sketchEditingFeature={sketchEditingFeature}
        onSketchEditFeature={setSketchEditingFeature}
        onMount={handleSketchMount}
      />
    </Engine>
  ) : null;
}

export const Map = forwardRef(MapFn);
