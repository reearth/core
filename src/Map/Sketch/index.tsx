// Reference: Sketch feature is basically referenced from https://github.com/takram-design-engineering/plateau-view/blob/main/libs/sketch/src/SketchTool.tsx

import { ForwardRefRenderFunction, RefObject, forwardRef } from "react";

import { ComputedLayer, SelectedFeatureInfo } from "../../mantle";
import { InteractionModeType } from "../../Visualizer/interactionMode";
import { EngineRef, Feature, LayerSelectionReason, LayersRef, SketchRef } from "../types";

import useHooks from "./hooks";
import { SketchComponentType, SketchEventProps, SketchFeature, SketchType } from "./types";

export * from "./types";

export type OnLayerSelectType = (
  layerId: string | undefined,
  featureId: string | undefined,
  layer: (() => Promise<ComputedLayer | undefined>) | undefined,
  reason: LayerSelectionReason | undefined,
  info: SelectedFeatureInfo | undefined,
) => void;

export type SketchProps = {
  layersRef: RefObject<LayersRef>;
  engineRef: RefObject<EngineRef>;
  SketchComponent?: SketchComponentType;
  selectedFeature?: Feature;
  interactionMode?: InteractionModeType;
  overrideInteractionMode?: (mode: InteractionModeType) => void;
  onSketchTypeChange?: (type: SketchType | undefined, from?: "editor" | "plugin") => void;
  onSketchFeatureCreate?: (feature: SketchFeature | null) => void;
  onSketchPluginFeatureCreate?: (props: SketchEventProps) => void;
  onLayerSelect?: OnLayerSelectType;
};

const Sketch: ForwardRefRenderFunction<SketchRef, SketchProps> = (
  {
    layersRef,
    engineRef,
    interactionMode = "default",
    selectedFeature,
    SketchComponent,
    overrideInteractionMode,
    onSketchTypeChange,
    onSketchFeatureCreate,
    onSketchPluginFeatureCreate,
    onLayerSelect,
  },
  ref,
) => {
  const { state, extrudedHeight, geometryOptions, color, disableShadow, enableRelativeHeight } =
    useHooks({
      ref,
      layersRef,
      engineRef,
      interactionMode,
      selectedFeature,
      overrideInteractionMode,
      onSketchTypeChange,
      onSketchFeatureCreate,
      onSketchPluginFeatureCreate,
      onLayerSelect,
    });
  if (state.matches("idle")) {
    return null;
  }
  return SketchComponent ? (
    <SketchComponent
      geometryOptions={geometryOptions}
      color={color}
      disableShadow={disableShadow}
      enableRelativeHeight={enableRelativeHeight}
      {...(state.matches("extruding") && {
        extrudedHeight,
      })}
    />
  ) : null;
};

export default forwardRef(Sketch);
