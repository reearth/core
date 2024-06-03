import { createContext } from "react";

import {
  LayerEditEvent,
  LayerSelectionReason,
  LayerVisibilityEvent,
  ViewerProperty,
} from "../engines";
import { ComputedFeature, ComputedLayer } from "../mantle";
import {
  LayerLoadEvent,
  LayerSelectWithRectEnd,
  LayerSelectWithRectMove,
  LayerSelectWithRectStart,
} from "../Map";
import { SketchEventCallback, SketchType } from "../Map/Sketch/types";

import { InteractionModeType } from "./interactionMode";
import { Viewport } from "./useViewport";

type CoreContext = {
  interactionMode?: InteractionModeType;
  selectedLayer?: {
    layerId?: string | undefined;
    featureId?: string | undefined;
    layer?: ComputedLayer | undefined;
    reason?: LayerSelectionReason | undefined;
  };
  selectedComputedFeature?: ComputedFeature | undefined;
  viewport?: Viewport;
  overriddenViewerProperty?: ViewerProperty;
  overrideViewerProperty?: (pluginId: string, property: ViewerProperty) => void;
  handleCameraForceHorizontalRollChange?: (enable?: boolean) => void;
  handleInteractionModeChange?: (mode?: InteractionModeType | undefined) => void;
  onSketchPluginFeatureCreate?: (cb: SketchEventCallback) => void;
  onSketchTypeChange?: (cb: (type: SketchType | undefined) => void) => void;
  onLayerVisibility?: (cb: (e: LayerVisibilityEvent) => void) => void;
  onLayerLoad?: (cb: (e: LayerLoadEvent) => void) => void;
  onLayerEdit?: (cb: (e: LayerEditEvent) => void) => void;
  onLayerSelectWithRectStart?: (cb: (e: LayerSelectWithRectStart) => void) => void;
  onLayerSelectWithRectMove?: (cb: (e: LayerSelectWithRectMove) => void) => void;
  onLayerSelectWithRectEnd?: (cb: (e: LayerSelectWithRectEnd) => void) => void;
};

const coreContext = createContext<CoreContext>({});

export { coreContext };
