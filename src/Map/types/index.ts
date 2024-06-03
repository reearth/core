import { Cartesian3 } from "cesium";
import { type LineString, type MultiPolygon, type Polygon, type Point } from "geojson";
import type {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  ReactNode,
  CSSProperties,
  RefObject,
  MutableRefObject,
} from "react";

import { PickedFeature } from "../../engines/Cesium/pickMany";
import { CursorType } from "../../engines/Cesium/types";
import type {
  LatLngHeight,
  Camera,
  Rect,
  LatLng,
  DataType,
  SelectedFeatureInfo,
  Feature,
  ComputedFeature,
  CameraPosition,
  LUT,
} from "../../mantle";
import type {
  CameraOptions,
  FlyTo,
  FlyToDestination,
  LookAtDestination,
  Position2d,
  Position3d,
  ScreenSpaceCameraControllerOptions,
} from "../../types";
import type {
  FeatureComponentType,
  ClusterComponentType,
  LayerSelectionReason,
  Ref as LayersRef,
} from "../Layers";
import { SketchComponentType } from "../Sketch";
import { SketchAppearance, SketchType } from "../Sketch/types";
import type { TimelineManagerRef } from "../useTimelineManager";

export type {
  FeatureComponentProps,
  FeatureComponentType,
  ClusterComponentType,
  ClusterComponentProps,
  ClusterProperty,
  Ref as LayersRef,
  LayerSelectionReason,
} from "../Layers";
export type {
  Atom,
  DataType,
  DataRange,
  Feature,
  Layer,
  LayerSimple,
  ComputedFeature,
  ComputedLayer,
  Geometry,
  AppearanceTypes,
  Camera,
  Typography,
  LatLng,
  Rect,
  LatLngHeight,
  ValueTypes,
  ValueType,
} from "../../mantle";
export * from "./event";

export type EngineRef = {
  name: string;
  requestRender: () => void;
  getViewport: () => Rect | undefined;
  getCamera: () => Camera | undefined;
  getCameraFovInfo: (options: { withTerrain?: boolean; calcViewSize?: boolean }) =>
    | {
        center?: LatLngHeight;
        viewSize?: number;
      }
    | undefined;
  getLocationFromScreen: (x: number, y: number, withTerrain?: boolean) => LatLngHeight | undefined;
  sampleTerrainHeight: (lng: number, lat: number) => Promise<number | undefined>;
  computeGlobeHeight: (lng: number, lat: number, height?: number) => number | undefined;
  getGlobeHeight: () => void;
  toXYZ: (
    lng: number,
    lat: number,
    height: number,
    options?: { useGlobeEllipsoid?: boolean },
  ) => [x: number, y: number, z: number] | undefined;
  toLngLatHeight: (
    x: number,
    y: number,
    z: number,
    options?: { useGlobeEllipsoid?: boolean },
  ) => [lng: number, lat: number, height: number] | undefined;
  convertScreenToPositionOffset: (
    rawPosition: [x: number, y: number, z: number],
    screenOffset: [x: number, y: number],
  ) => [x: number, y: number, z: number] | undefined;
  isPositionVisible: (position: [x: number, y: number, z: number]) => boolean;
  setView: (camera: CameraPosition) => void;
  toWindowPosition: (
    position: [x: number, y: number, z: number],
  ) => [x: number, y: number] | undefined;
  getExtrudedHeight: (
    position: [x: number, y: number, z: number],
    windowPosition: [x: number, y: number],
  ) => number | undefined;
  getSurfaceDistance: (point1: Cartesian3, point2: Cartesian3) => number | undefined;
  equalsEpsilon2d: (
    point1: Position2d,
    point2: Position2d,
    relativeEpsilon: number | undefined,
    absoluteEpsilon: number | undefined,
  ) => boolean;
  equalsEpsilon3d: (
    point1: Position3d,
    point2: Position3d,
    relativeEpsilon: number | undefined,
    absoluteEpsilon: number | undefined,
  ) => boolean;
  createGeometry: ({
    type,
    controlPoints,
  }: {
    type: SketchType;
    controlPoints: Position3d[];
  }) => LineString | Polygon | MultiPolygon | Point | undefined;
  setCursor: (cursor: CursorType) => void;
  flyTo: FlyTo;
  flyToBBox: (
    bbox: [number, number, number, number],
    options?: CameraOptions & {
      heading?: number;
      pitch?: number;
      range?: number;
    },
  ) => void;
  rotateOnCenter: (radian: number) => void;
  overrideScreenSpaceController: (options: ScreenSpaceCameraControllerOptions) => void;
  lookAt: (destination: LookAtDestination, options?: CameraOptions) => void;
  lookAtLayer: (layerId: string) => void;
  zoomIn: (amount: number, options?: CameraOptions) => void;
  zoomOut: (amount: number, options?: CameraOptions) => void;
  orbit: (radians: number) => void;
  rotateRight: (radians: number) => void;
  changeSceneMode: (sceneMode: SceneMode | undefined, duration?: number) => void;
  getClock: () => Clock | undefined;
  captureScreen: (type?: string, encoderOptions?: number) => string | undefined;
  enableScreenSpaceCameraController: (enabled: boolean) => void;
  lookHorizontal: (amount: number) => void;
  lookVertical: (amount: number) => void;
  moveForward: (amount: number) => void;
  moveBackward: (amount: number) => void;
  moveUp: (amount: number) => void;
  moveDown: (amount: number) => void;
  moveLeft: (amount: number) => void;
  moveRight: (amount: number) => void;
  moveOverTerrain: (offset?: number) => void;
  flyToGround: (destination: FlyToDestination, options?: CameraOptions, offset?: number) => void;
  mouseEventCallbacks: MouseEventCallbacks;
  pause: () => void;
  play: () => void;
  changeSpeed: (speed: number) => void;
  changeStart: (start: Date) => void;
  changeStop: (stop: Date) => void;
  changeTime: (time: Date) => void;
  tick: () => Date | void;
  inViewport: (location?: LatLng) => boolean;
  onTick: TickEvent;
  tickEventCallback?: RefObject<TickEventCallback[]>;
  removeTickEventListener: TickEvent;
  findFeatureById: (layerId: string, featureId: string) => Feature | undefined;
  bringToFront: (layerId: string) => void;
  sendToBack: (layerId: string) => void;
  findFeaturesByIds: (layerId: string, featureId: string[]) => Feature[] | undefined;
  findComputedFeatureById: (layerId: string, featureId: string) => ComputedFeature | undefined;
  findComputedFeaturesByIds: (
    layerId: string,
    featureId: string[],
  ) => ComputedFeature[] | undefined;
  selectFeatures: (layerId: string, featureId: string[]) => void;
  unselectFeatures: (layerId: string, featureId: string[]) => void;
  pickManyFromViewport: (
    windowPosition: [x: number, y: number],
    windowWidth: number,
    windowHeight: number,
    // TODO: Get condition as expression for plugin
    condition?: (f: PickedFeature) => boolean,
  ) => PickedFeature[] | undefined;
} & MouseEventHandles;

export type EngineProps = {
  className?: string;
  style?: CSSProperties;
  isEditable?: boolean;
  isBuilt?: boolean;
  property?: SceneProperty;
  camera?: Camera;
  cameraForceHorizontalRoll?: boolean;
  small?: boolean;
  children?: ReactNode;
  ready?: boolean;
  selectedLayerId?: {
    layerId?: string;
    featureId?: string;
  };
  featureFlags: number;
  layerSelectionReason?: LayerSelectionReason;
  isLayerDraggable?: boolean;
  isLayerDragging?: boolean;
  shouldRender?: boolean;
  meta?: Record<string, unknown>;
  layersRef?: RefObject<LayersRef>;
  requestingRenderMode?: MutableRefObject<RequestingRenderMode>;
  timelineManagerRef?: TimelineManagerRef;
  onLayerSelect?: (
    layerId: string | undefined,
    featureId?: string,
    options?: LayerSelectionReason,
    info?: SelectedFeatureInfo,
  ) => void;
  onCameraChange?: (camera: Camera) => void;
  onLayerDrag?: (layerId: string, featureId: string | undefined, position: LatLng) => void;
  onLayerDrop?: (
    layerId: string,
    featureId: string | undefined,
    position: LatLng | undefined,
  ) => void;
  onLayerEdit?: (e: LayerEditEvent) => void;
  onMount?: () => void;
  onLayerVisibility?: (e: LayerVisibilityEvent) => void;
  onLayerLoad?: (e: LayerLoadEvent) => void;
  onLayerSelectWithRectStart?: (e: LayerSelectWithRectStart) => void;
  onLayerSelectWithRectMove?: (e: LayerSelectWithRectMove) => void;
  onLayerSelectWithRectEnd?: (e: LayerSelectWithRectEnd) => void;
};

export type LayerEditEvent = {
  layerId: string | undefined;
  scale?: {
    width: number;
    length: number;
    height: number;
    location: LatLngHeight;
  };
  rotate?: { heading: number; pitch: number; roll: number };
};

export type LayerSelectWithRect = MouseEventProps & { pressedKey?: "shift" };
export type LayerSelectWithRectStart = LayerSelectWithRect;
export type LayerSelectWithRectMove = LayerSelectWithRect & {
  startX?: number;
  startY?: number;
  width?: number;
  height?: number;
};
export type LayerSelectWithRectEnd = LayerSelectWithRect & {
  features: PickedFeature[] | undefined;
  isClick: boolean;
};

export type LayerVisibilityEvent = {
  layerId: string | undefined;
};

export type LayerLoadEvent = {
  layerId: string | undefined;
};

export type Clock = {
  current?: Date;
  start?: Date;
  stop?: Date;
  speed?: number;
  playing?: boolean;
};

export type MouseEventProps = {
  x?: number;
  y?: number;
  lat?: number;
  lng?: number;
  height?: number;
  layerId?: string;
  delta?: number;
};

export type MouseEventCallback = (props: MouseEventProps) => void;
export type MouseWheelEventCallback = (props: MouseEventProps) => void;
export type MouseEventTypes =
  | "click"
  | "doubleclick"
  | "mousedown"
  | "mouseup"
  | "rightclick"
  | "rightdown"
  | "rightup"
  | "middleclick"
  | "middledown"
  | "middleup"
  | "mousemove"
  | "mouseenter"
  | "mouseleave"
  | "wheel";

export type MouseEvents = {
  [key in MouseEventTypes]: MouseEventCallback;
} & {
  wheel: MouseWheelEventCallback;
};

export type MouseEventHandles = {
  onClick: (fn: MouseEvents["click"]) => void;
  onDoubleClick: (fn: MouseEvents["doubleclick"]) => void;
  onMouseDown: (fn: MouseEvents["mousedown"]) => void;
  onMouseUp: (fn: MouseEvents["mouseup"]) => void;
  onRightClick: (fn: MouseEvents["rightclick"]) => void;
  onRightDown: (fn: MouseEvents["rightdown"]) => void;
  onRightUp: (fn: MouseEvents["rightup"]) => void;
  onMiddleClick: (fn: MouseEvents["middleclick"]) => void;
  onMiddleDown: (fn: MouseEvents["middledown"]) => void;
  onMiddleUp: (fn: MouseEvents["middleup"]) => void;
  onMouseMove: (fn: MouseEvents["mousemove"]) => void;
  onMouseEnter: (fn: MouseEvents["mouseenter"]) => void;
  onMouseLeave: (fn: MouseEvents["mouseleave"]) => void;
  onWheel: (fn: MouseEvents["wheel"]) => void;
};

export type MouseEventCallbacks = { [key in keyof MouseEvents]: MouseEvents[key][] };

export type TickEvent = (cb: TickEventCallback) => void;
export type TickEventCallback = (current: Date, clock: { start: Date; stop: Date }) => void;

export type SceneMode = "3d" | "2d" | "columbus";
export type IndicatorTypes = "default" | "crosshair" | "custom";

export type TerrainProperty = {
  enabled?: boolean;
  type?: "cesium" | "arcgis" | "cesiumion"; // default: cesium
  url?: string;
  normal?: boolean;
  terrainCesiumIonAsset?: string;
  terrainCesiumIonAccessToken?: string;
  terrainCesiumIonUrl?: string;
  // TODO: Add encode option
  // Need to specify a tile from `tiles` option with `heatmap` option.
  heatmap?: {
    type?: "custom"; // TODO: Support Cesium's terrain heatmap as built-in: https://sandcastle.cesium.com/?src=Globe%20Materials.html
    colorLUT?: LUT;
    minHeight?: number;
    maxHeight?: number;
    logarithmic?: boolean;
  };
};

export type SceneProperty = {
  shadows?: boolean;
  shadowMap?: {
    size?: 1024 | 2048 | 4096;
    softShadows?: boolean;
    darkness?: number;
    maximumDistance?: number;
  };
  globe?: {
    baseColor?: string;
    enableLighting?: boolean;
    showGroundAtmosphere?: boolean;
    atmosphereLightIntensity?: number;
    atmosphereSaturationShift?: number;
    atmosphereBrightnessShift?: number;
    atmosphereHueShift?: number;
    depthTestAgainstTerrain?: boolean;
    imageBasedLighting?: {
      enabled?: boolean;
      intensity?: number;
      specularEnvironmentMaps?: string;
      sphericalHarmonicCoefficients?: [x: number, y: number, z: number][];
    };
    shadowDarkness?: number;
    debug?: {
      showWireframe?: boolean;
    };
  };
  terrain?: TerrainProperty;
  scene?: {
    backgroundColor?: string;
    mode?: SceneMode;
    verticalExaggeration?: number; // default: 1
    verticalExaggerationRelativeHeight?: number; // default: 0
    vr?: boolean;
    light?: {
      type?: "sunLight" | "directionalLight";
      directionX?: number;
      directionY?: number;
      directionZ?: number;
      color?: string;
      intensity?: number;
    };
    antialias?: "low" | "medium" | "high" | "extreme";
    debug?: {
      showFramesPerSecond?: boolean;
    };
  };
  tiles?: {
    id: string;
    type?: string;
    url?: string;
    opacity?: number;
    zoomLevel?: number[];
    zoomLevelForURL?: number[];
    heatmap?: boolean;
  }[];
  tileLabels?: {
    id: string;
    labelType: "japan_gsi_optimal_bvmap"; // | "other_map"
    style: Record<string, any>; // Function isn't allowed
  }[];
  skyBox?: {
    show?: boolean;
  };
  sun?: {
    show?: boolean;
  };
  moon?: {
    show?: boolean;
  };
  fog?: {
    enabled?: boolean;
    density?: number;
  };
  skyAtmosphere?: {
    show?: boolean;
    atmosphereLightIntensity?: number; // default: 50
    saturationShift?: number;
    brightnessShift?: number;
  };
  camera?: {
    camera?: Camera;
    allowEnterGround?: boolean;
  };
  cameraLimiter?: {
    enabled?: boolean;
    showHelper?: boolean;
    targetArea?: Camera;
    targetWidth?: number;
    targetLength?: number;
  };
  ambientOcclusion?: {
    enabled?: boolean;
    quality?: "low" | "medium" | "high" | "extreme";
    intensity?: number;
    ambientOcclusionOnly?: boolean;
  };
  indicator?: {
    type: IndicatorTypes;
    image?: string;
    imageScale?: number;
  };
  engine?: {
    cesium?: {
      ionAccessToken?: string;
    };
  };
};

export type EngineComponent = ForwardRefExoticComponent<
  PropsWithoutRef<EngineProps> & RefAttributes<EngineRef>
>;

export type Engine = {
  component: EngineComponent;
  featureComponent: FeatureComponentType;
  clusterComponent: ClusterComponentType;
  sketchComponent: SketchComponentType;
  delegatedDataTypes?: DataType[];
};

export type RequestingRenderMode = -1 | 0 | 1; // -1: force render on every postUpdate, 0: no request to render, 1: request one frame

export type SketchRef = {
  setType: (type: SketchType | undefined, from?: "editor" | "plugin") => void;
  setColor: (color: string) => void;
  setDefaultAppearance: (appearance: SketchAppearance) => void;
  disableShadow: (disable: boolean) => void;
  enableRelativeHeight: (enable: boolean) => void;
  createDataOnly: (dataOnly: boolean) => void;
  allowRightClickToAbort: (allow: boolean) => void;
  allowAutoResetInteractionMode: (allow: boolean) => void;
};
