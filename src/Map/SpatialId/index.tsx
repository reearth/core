import { forwardRef, ForwardRefRenderFunction } from "react";
import { RefObject } from "use-callback-ref/dist/es5/types";

import SpatialIdSpace from "../../engines/Cesium/SpatialId";
import { InteractionModeType } from "../../Visualizer";
import { EngineRef } from "../types";

import useHooks from "./hooks";
import { SpatialIdRef } from "./types";

type SpatialIdProps = {
  engineRef: RefObject<EngineRef>;
  terrainEnabled?: boolean;
  interactionMode?: InteractionModeType;
  overrideInteractionMode?: (mode: InteractionModeType) => void;
  onMount?: () => void;
};

const SpatialId: ForwardRefRenderFunction<SpatialIdRef, SpatialIdProps> = (
  { engineRef, terrainEnabled, interactionMode, overrideInteractionMode, onMount },
  ref,
) => {
  const { spaces } = useHooks({
    ref,
    engineRef,
    terrainEnabled,
    interactionMode,
    overrideInteractionMode,
    onMount,
  });
  return spaces.length > 0
    ? spaces.map(space => <SpatialIdSpace key={space.id} space={space} />)
    : null;
};

export default forwardRef(SpatialId);
