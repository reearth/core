import {
  ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { RefObject } from "use-callback-ref/dist/es5/types";

import { InteractionModeType } from "../../Visualizer";
import { EngineRef, MouseEventProps } from "../types";

import {
  SpatialIdRef,
  SpatialIdSpacePickingState,
  SpatialIdSpaceType,
  SpatialIdSpaceData,
  SpatialIdPickSpaceOptions,
} from "./types";
import { createSpatialIdFloorSpaces, createSpatialIdSpace, getSpaceData } from "./utils";

type Props = {
  ref: ForwardedRef<SpatialIdRef>;
  engineRef: RefObject<EngineRef>;
  terrainEnabled?: boolean;
  interactionMode?: InteractionModeType;
  overrideInteractionMode?: (mode: InteractionModeType) => void;
  onMount?: () => void;
};

export const SPATIALID_DEFAULT_ZOOM = 20;
export const SPATIALID_DEFAULT_MAX_HEIGHT = 1000;
export const SPATIALID_DEFAULT_COLOR = "#00bebe";
export const SPATIALID_DEFAULT_DATA_ONLY = false;
export const SPATIALID_DEFAULT_RIGHT_CLICK_TO_EXIT = true;

export default ({
  ref,
  engineRef,
  terrainEnabled,
  interactionMode,
  overrideInteractionMode,
  onMount,
}: Props) => {
  const [state, setState] = useState<SpatialIdSpacePickingState>("idle");

  const [spatialIdSpaces, setSpatialIdSpaces] = useState<SpatialIdSpaceType[]>([]);
  const [floorSpaces, setFloorSpaces] = useState<SpatialIdSpaceType[]>([]);
  const [selectorSpace, setSelectorSpace] = useState<SpatialIdSpaceType | null>(null);

  const spaces = useMemo(() => {
    return [...spatialIdSpaces, ...floorSpaces, ...(selectorSpace ? [selectorSpace] : [])];
  }, [spatialIdSpaces, floorSpaces, selectorSpace]);

  const [basePosition, setBasePosition] = useState<[number, number, number] | null>(null);
  const [baseCoordinate, setBaseCoordinate] = useState<[number, number, number] | null>(null);

  const [pickOptions, setPickOptions] = useState<Required<SpatialIdPickSpaceOptions>>({
    zoom: SPATIALID_DEFAULT_ZOOM,
    maxHeight: SPATIALID_DEFAULT_MAX_HEIGHT,
    color: SPATIALID_DEFAULT_COLOR,
    dataOnly: SPATIALID_DEFAULT_DATA_ONLY,
    rightClickToExit: SPATIALID_DEFAULT_RIGHT_CLICK_TO_EXIT,
  });

  const pickSpace = useCallback(
    (options?: SpatialIdPickSpaceOptions) => {
      setState("coordinate");
      setPickOptions(prev => ({ ...prev, ...options }));
      overrideInteractionMode?.("spatialId");
    },
    [overrideInteractionMode],
  );

  const interactionModeRef = useRef(interactionMode);
  interactionModeRef.current = interactionMode;

  const finishPicking = useCallback(() => {
    setState("idle");
    setSelectorSpace(null);
    setBasePosition(null);
    setBaseCoordinate(null);
    setFloorSpaces([]);
    overrideInteractionMode?.(
      interactionModeRef.current === "spatialId"
        ? "default"
        : interactionModeRef.current ?? "default",
    );
    engineRef.current?.requestRender();
  }, [overrideInteractionMode, engineRef]);

  // handle events
  const handleMouseUp = useCallback(
    (props: MouseEventProps) => {
      if (state === "idle") return;
      if (tempSwitchToMoveMode.current) return;

      if (state === "coordinate") {
        if (!selectorSpace || props.lat === undefined || props.lng === undefined) return;
        setState("floor");
        setBaseCoordinate([props.lng, props.lat, terrainEnabled ? props.height ?? 0 : 0]);
        setBasePosition(
          engineRef.current?.toXYZ(props.lng, props.lat, props.height ?? 0, {
            useGlobeEllipsoid: !terrainEnabled,
          }) ?? null,
        );

        setSelectorSpace(prev =>
          prev ? { ...prev, type: "selector", color: pickOptions.color } : null,
        );

        const floorSpaces = createSpatialIdFloorSpaces(
          selectorSpace.space,
          pickOptions.maxHeight,
          pickOptions.color,
        );
        setFloorSpaces(floorSpaces);
      } else if (state === "floor") {
        if (!selectorSpace) return;

        const confirmedSpace: SpatialIdSpaceType = {
          ...selectorSpace,
          type: "confirmed",
          color: pickOptions.color,
        };

        if (!pickOptions.dataOnly) {
          setSpatialIdSpaces(prev => [...prev, confirmedSpace]);
        }

        finishPicking();

        const spaceData = getSpaceData(confirmedSpace.space);
        onSpacePickEvents.current.forEach(cb => cb(spaceData));
      }
    },
    [state, terrainEnabled, engineRef, selectorSpace, pickOptions, finishPicking],
  );

  const handleMouseMove = useCallback(
    (props: MouseEventProps) => {
      if (state === "idle") return;
      if (tempSwitchToMoveMode.current) return;

      if (state === "coordinate") {
        if (props.lat === undefined || props.lng === undefined) return;

        const newSpace = createSpatialIdSpace(
          props.lng,
          props.lat,
          terrainEnabled ? props.height ?? 0 : 0,
          pickOptions.zoom,
        );

        if (newSpace.space.id === selectorSpace?.space.id) return;

        setSelectorSpace({ ...newSpace, type: "coordinate", color: pickOptions.color });
      } else if (state === "floor") {
        if (
          props.x === undefined ||
          props.y === undefined ||
          basePosition === null ||
          baseCoordinate === null
        )
          return;

        const height =
          engineRef.current?.getExtrudedHeight(basePosition, [props.x, props.y], true) ?? 0;

        if (baseCoordinate[2] + height > pickOptions.maxHeight) return;

        const newSpace = createSpatialIdSpace(
          baseCoordinate[0],
          baseCoordinate[1],
          baseCoordinate[2] + height,
          pickOptions.zoom,
        );

        if (newSpace.space.id === selectorSpace?.space.id || newSpace.space.zfxy.f < 0) return;

        setSelectorSpace({ ...newSpace, type: "selector", color: pickOptions.color });
      }
    },
    [state, selectorSpace, basePosition, baseCoordinate, engineRef, terrainEnabled, pickOptions],
  );

  const handleMouseRightClick = useCallback(() => {
    if (state === "idle") return;
    if (state === "coordinate" && pickOptions.rightClickToExit) {
      finishPicking();
    } else if (state === "floor") {
      setSelectorSpace(null);
      setBasePosition(null);
      setBaseCoordinate(null);
      setFloorSpaces([]);
      setState("coordinate");
    }
    engineRef.current?.requestRender();
  }, [state, pickOptions, engineRef, finishPicking]);

  // bind mouse events
  const eventsBinded = useRef(false);

  const handleMouseUpRef = useRef(handleMouseUp);
  handleMouseUpRef.current = handleMouseUp;
  const handleMouseUpForRef = useCallback((props: MouseEventProps) => {
    handleMouseUpRef.current(props);
  }, []);

  const handleMouseMoveRef = useRef(handleMouseMove);
  handleMouseMoveRef.current = handleMouseMove;
  const handleMouseMoveForRef = useCallback((props: MouseEventProps) => {
    handleMouseMoveRef.current(props);
  }, []);

  const handleMouseRightClickRef = useRef(handleMouseRightClick);
  handleMouseRightClickRef.current = handleMouseRightClick;
  const handleMouseRightClickForRef = useCallback(() => {
    handleMouseRightClickRef.current();
  }, []);

  useEffect(() => {
    if (eventsBinded.current || !engineRef.current) return;
    eventsBinded.current = true;
    engineRef.current.onMouseUp(handleMouseUpForRef);
    engineRef.current.onMouseMove(handleMouseMoveForRef);
    engineRef.current.onRightClick(handleMouseRightClickForRef);
  }, [engineRef, handleMouseUpForRef, handleMouseMoveForRef, handleMouseRightClickForRef]);

  // cancel picking when interaction mode changes
  const stateRef = useRef(state);
  stateRef.current = state;
  const finishPickingRef = useRef(finishPicking);
  finishPickingRef.current = finishPicking;
  useEffect(() => {
    if (tempSwitchToMoveMode.current) return;
    if (interactionMode !== "spatialId" && stateRef.current !== "idle") {
      finishPickingRef.current();
    }
  }, [interactionMode]);

  // events
  const onSpacePickEvents = useRef<((space: SpatialIdSpaceData) => void)[]>([]);

  const bindEventOnSpacePick = useCallback((cb: (space: SpatialIdSpaceData) => void) => {
    onSpacePickEvents.current.push(cb);
  }, []);

  // ref
  useImperativeHandle(
    ref,
    () => ({
      pickSpace,
      onSpacePick: bindEventOnSpacePick,
      exitPickSpace: finishPicking,
    }),
    [pickSpace, bindEventOnSpacePick, finishPicking],
  );

  // press space to move
  const tempSwitchToMoveMode = useRef(false);
  useEffect(() => {
    return window.addEventListener("keydown", e => {
      if (e.code === "Space" && stateRef.current !== "idle") {
        tempSwitchToMoveMode.current = true;
        overrideInteractionMode?.("move");
      }
    });
  }, [overrideInteractionMode]);

  useEffect(() => {
    return window.addEventListener("keyup", e => {
      if (e.code === "Space" && tempSwitchToMoveMode.current) {
        tempSwitchToMoveMode.current = false;
        overrideInteractionMode?.("spatialId");
      }
    });
  }, [overrideInteractionMode]);

  useEffect(() => {
    onMount?.();
  }, [onMount]);

  return {
    spaces,
  };
};
