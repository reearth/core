import {
  Entity,
  Cesium3DTileFeature,
  Ion,
  Cesium3DTileset,
  JulianDate,
  Cesium3DTilePointFeature,
  Model,
  Cartographic,
  Viewer as CesiumViewer,
  Primitive,
  GroundPrimitive,
  ShadowMap,
  ImageryLayer,
  Scene,
  Math as CesiumMath,
} from "cesium";
import { isEqual } from "lodash-es";
import { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import type { CesiumComponentRef, CesiumMovementEvent, RootEventTarget } from "resium";
import { useCustomCompareCallback } from "use-custom-compare";

import type {
  Camera,
  LayerSelectionReason,
  EngineRef,
  SceneProperty,
  MouseEvents,
  LayerEditEvent,
  LayerVisibilityEvent,
} from "..";
import { e2eAccessToken, setE2ECesiumViewer } from "../../e2eConfig";
import { ComputedFeature, DataType, SelectedFeatureInfo } from "../../mantle";
import {
  LayerLoadEvent,
  LayerSelectWithRectEnd,
  LayerSelectWithRectMove,
  LayerSelectWithRectStart,
  LayersRef,
} from "../../Map";
import { TimelineManagerRef } from "../../Map/useTimelineManager";
import { FEATURE_FLAGS } from "../../Visualizer/featureFlags";

import { getCamera, isSelectable } from "./common";
import { getTag, type Context as FeatureContext } from "./Feature";
import { arrayToCartecian3 } from "./helpers/sphericalHaromic";
import { useCameraLimiter } from "./hooks/useCameraLimiter";
import useEngineRef from "./hooks/useEngineRef";
import { useLayerSelectWithRect } from "./hooks/useLayerSelectWithRect";
import { useOverrideGlobeShader } from "./hooks/useOverrideGlobeShader/useOverrideGlobeShader";
import { InternalCesium3DTileFeature } from "./types";
import { makeMouseEventProps } from "./utils/mouse";
import { findEntity, getEntityContent } from "./utils/utils";

interface CustomGlobeSurface {
  tileProvider: {
    _debug: {
      wireframe: boolean;
    };
  };
}

type CesiumMouseEvent = (movement: CesiumMovementEvent, target: RootEventTarget) => void;
type CesiumMouseWheelEvent = (delta: number) => void;

export default ({
  ref,
  property,
  camera,
  selectedLayerId,
  selectionReason,
  meta,
  layersRef,
  featureFlags,
  timelineManagerRef,
  cameraForceHorizontalRoll = false,
  onLayerSelect,
  onCameraChange,
  onLayerEdit,
  onLayerSelectWithRectStart,
  onLayerSelectWithRectMove,
  onLayerSelectWithRectEnd,
  onMount,
  onLayerVisibility,
  onLayerLoad,
}: {
  ref: React.ForwardedRef<EngineRef>;
  property?: SceneProperty;
  camera?: Camera;
  selectedLayerId?: {
    layerId?: string;
    featureId?: string;
  };
  layersRef?: RefObject<LayersRef>;
  selectionReason?: LayerSelectionReason;
  meta?: Record<string, unknown>;
  featureFlags: number;
  timelineManagerRef?: TimelineManagerRef;
  cameraForceHorizontalRoll?: boolean;
  onLayerSelect?: (
    layerId?: string,
    featureId?: string,
    options?: LayerSelectionReason,
    info?: SelectedFeatureInfo,
  ) => void;
  onCameraChange?: (camera: Camera) => void;
  onLayerEdit?: (e: LayerEditEvent) => void;
  onLayerSelectWithRectStart?: (e: LayerSelectWithRectStart) => void;
  onLayerSelectWithRectMove?: (e: LayerSelectWithRectMove) => void;
  onLayerSelectWithRectEnd?: (e: LayerSelectWithRectEnd) => void;
  onMount?: () => void;
  onLayerVisibility?: (e: LayerVisibilityEvent) => void;
  onLayerLoad?: (e: LayerLoadEvent) => void;
}) => {
  const cesium = useRef<CesiumComponentRef<CesiumViewer>>(null);
  const cesiumIonDefaultAccessToken =
    typeof meta?.cesiumIonAccessToken === "string" && meta.cesiumIonAccessToken
      ? meta.cesiumIonAccessToken
      : Ion.defaultAccessToken;
  const cesiumIonAccessToken =
    property?.engine?.cesium?.ionAccessToken || cesiumIonDefaultAccessToken;

  // expose ref
  const engineAPI = useEngineRef(ref, cesium);

  const layerSelectWithRectEventHandlers = useLayerSelectWithRect({
    cesium,
    engineAPI,
    onLayerSelectWithRectStart,
    onLayerSelectWithRectMove,
    onLayerSelectWithRectEnd,
    featureFlags,
  });

  // shadow map
  type ShadowMapBias = {
    polygonOffsetFactor?: number;
    polygonOffsetUnits?: number;
    normalOffsetScale?: number;
    normalShading?: boolean;
    normalShadingSmooth?: number;
    depthBias?: number;
  };

  useEffect(() => {
    const shadowMap = cesium?.current?.cesiumElement?.shadowMap as
      | (ShadowMap & {
          _terrainBias?: ShadowMapBias;
          _pointBias?: ShadowMapBias;
          _primitiveBias?: ShadowMapBias;
        })
      | undefined;
    if (!shadowMap) return;
    shadowMap.softShadows = property?.shadowMap?.softShadows ?? false;
    shadowMap.darkness = property?.shadowMap?.darkness ?? 0.3;
    shadowMap.size = property?.shadowMap?.size ?? 2048;
    shadowMap.maximumDistance = property?.shadowMap?.maximumDistance ?? 5000;
    shadowMap.fadingEnabled = true;
    shadowMap.normalOffset = true;

    // bias
    const defaultTerrainBias: ShadowMapBias = {
      polygonOffsetFactor: 1.1,
      polygonOffsetUnits: 4.0,
      normalOffsetScale: 0.5,
      normalShading: true,
      normalShadingSmooth: 0.3,
      depthBias: 0.0001,
    };
    const defaultPrimitiveBias: ShadowMapBias = {
      polygonOffsetFactor: 1.1,
      polygonOffsetUnits: 4.0,
      normalOffsetScale: 0.1 * 100,
      normalShading: true,
      normalShadingSmooth: 0.05,
      depthBias: 0.00002 * 10,
    };
    const defaultPointBias: ShadowMapBias = {
      polygonOffsetFactor: 1.1,
      polygonOffsetUnits: 4.0,
      normalOffsetScale: 0.0,
      normalShading: true,
      normalShadingSmooth: 0.1,
      depthBias: 0.0005,
    };

    if (!shadowMap._terrainBias) {
      if (import.meta.env.DEV) {
        throw new Error("`shadowMap._terrainBias` could not found");
      }
    } else {
      Object.assign(shadowMap._terrainBias, defaultTerrainBias);
    }

    if (!shadowMap._primitiveBias) {
      if (import.meta.env.DEV) {
        throw new Error("`shadowMap._primitiveBias` could not found");
      }
    } else {
      Object.assign(shadowMap._primitiveBias, defaultPrimitiveBias);
    }

    if (!shadowMap._pointBias) {
      if (import.meta.env.DEV) {
        throw new Error("`shadowMap._pointBias` could not found");
      }
    } else {
      Object.assign(shadowMap._pointBias, defaultPointBias);
    }
  }, [
    property?.shadowMap?.softShadows,
    property?.shadowMap?.darkness,
    property?.shadowMap?.size,
    property?.shadowMap?.maximumDistance,
  ]);

  // move to initial position at startup
  const initialCameraFlight = useRef(false);

  const handleMount = useCustomCompareCallback(
    () => {
      if (initialCameraFlight.current) return;
      initialCameraFlight.current = true;
      if (property?.cameraLimiter?.enabled && property?.cameraLimiter?.targetArea) {
        engineAPI.flyTo(property?.cameraLimiter?.targetArea, { duration: 0 });
      } else if (property?.camera?.camera) {
        const camera = property?.camera?.camera;
        engineAPI.flyTo(camera as Camera, { duration: 0 });
      }
      const camera = getCamera(cesium?.current?.cesiumElement);
      if (camera) {
        onCameraChange?.(camera);
      }
      onMount?.();
    },
    [
      engineAPI,
      property?.camera?.camera,
      property?.cameraLimiter?.enabled,
      onCameraChange,
      onMount,
    ],
    (prevDeps, nextDeps) =>
      prevDeps[0] === nextDeps[0] &&
      isEqual(prevDeps[1], nextDeps[1]) &&
      prevDeps[2] === nextDeps[2] &&
      prevDeps[3] === nextDeps[3] &&
      prevDeps[4] === nextDeps[4],
  );

  const handleUnmount = useCallback(() => {
    initialCameraFlight.current = false;
  }, []);

  const prevSelectedEntity = useRef<
    | Entity
    | Cesium3DTileset
    | InternalCesium3DTileFeature
    | Primitive
    | GroundPrimitive
    | ImageryLayer
  >();
  const prevSelectedImageryFeatureId = useRef<string | undefined>();

  // manage layer selection
  useEffect(() => {
    const viewer = cesium.current?.cesiumElement;
    if (!viewer || viewer.isDestroyed()) return;

    if (prevSelectedImageryFeatureId.current === selectedLayerId?.featureId) return;

    const prevTag = getTag(prevSelectedEntity.current);
    if (
      (!prevTag?.featureId &&
        prevTag?.layerId &&
        selectedLayerId?.layerId &&
        prevTag?.layerId === selectedLayerId.layerId) ||
      (prevTag?.featureId &&
        selectedLayerId?.featureId &&
        prevTag?.featureId === selectedLayerId.featureId)
    )
      return;

    const entity =
      findEntity(viewer, undefined, selectedLayerId?.featureId) ||
      findEntity(viewer, selectedLayerId?.layerId);

    if (prevSelectedEntity.current === entity) return;

    const tag = getTag(entity);
    if (entity instanceof Entity && !tag?.hideIndicator) {
      viewer.selectedEntity = entity;
    } else {
      viewer.selectedEntity = undefined;
    }

    prevSelectedEntity.current = entity;

    // TODO: Support layers.selectFeature API for MVT
    if (!entity && selectedLayerId?.featureId) {
      // Find ImageryLayerFeature
      const ImageryLayerDataTypes: DataType[] = [];
      const layers = layersRef?.current?.findAll(
        layer =>
          layer.type === "simple" &&
          !!layer.data?.type &&
          ImageryLayerDataTypes.includes(layer.data?.type),
      );

      if (layers?.length) {
        // TODO: Get ImageryLayerFeature from `viewer.imageryLayers`.(But currently didn't find the way)
        const [feature, layerId] =
          ((): [ComputedFeature, string] | void => {
            for (const layer of layers) {
              const f = layer.computed?.features.find(
                feature => feature.id !== selectedLayerId?.featureId,
              );
              if (f) {
                return [f, layer.id];
              }
            }
          })() || [];
        onLayerSelect?.(layerId, feature?.id);
      }
    }

    if (tag?.unselectable) return;

    if (entity && entity instanceof Cesium3DTileFeature) {
      const tag = getTag(entity);
      if (tag) {
        const content = tileProperties(entity);
        onLayerSelect?.(
          tag.layerId,
          String(tag.featureId),
          content.length
            ? {
                defaultInfobox: {
                  title: entity.getProperty("name"),
                  content: {
                    type: "table",
                    value: content,
                  },
                },
              }
            : undefined,
          { feature: tag.computedFeature },
        );
      }
      return;
    }

    if (entity) {
      const layer = tag?.layerId
        ? layersRef?.current?.overriddenLayers().find(l => l.id === tag.layerId) ??
          layersRef?.current?.findById(tag.layerId)
        : undefined;
      // Sometimes only featureId is specified, so we need to sync entity tag.
      onLayerSelect?.(
        tag?.layerId,
        tag?.featureId,
        entity instanceof Entity && (entity.description || entity.properties)
          ? {
              defaultInfobox: {
                title: entity.name,
                content: getEntityContent(
                  entity,
                  cesium.current?.cesiumElement?.clock.currentTime ?? new JulianDate(),
                  tag?.layerId ? layer?.infobox?.property?.defaultContent : undefined,
                ),
              },
            }
          : undefined,
      );
    }
  }, [cesium, selectedLayerId, onLayerSelect, layersRef, featureFlags]);

  const sphericalHarmonicCoefficients = useMemo(
    () =>
      property?.globe?.shader?.sphericalHarmonicCoefficients
        ? arrayToCartecian3(
            property?.globe?.shader?.sphericalHarmonicCoefficients,
            property?.globe?.shader?.imageBasedLightIntensity,
          )
        : undefined,
    [
      property?.globe?.shader?.sphericalHarmonicCoefficients,
      property?.globe?.shader?.imageBasedLightIntensity,
    ],
  );

  useOverrideGlobeShader({
    cesium,
    sphericalHarmonicCoefficients,
    globeShadowDarkness: property?.globe?.shader?.shadowDarkness,
    globeImageBasedLighting: property?.globe?.shader?.imageBasedLighting,
    enableLighting: property?.globe?.enableLighting,
    hasVertexNormals: property?.terrain?.enabled && property.terrain.normal,
    terrain: property?.terrain,
  });

  const handleMouseEvent = useCallback(
    (type: keyof MouseEvents, e: CesiumMovementEvent, target: RootEventTarget) => {
      if (engineAPI.mouseEventCallbacks[type]?.length > 0) {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        const props = makeMouseEventProps(viewer, e);
        if (!props) return;
        const layerId = getLayerId(target);
        if (layerId) props.layerId = layerId;
        engineAPI.mouseEventCallbacks[type].forEach(cb => cb(props));
      }
    },
    [engineAPI],
  );

  const handleMouseWheel = useCallback(
    (delta: number) => {
      if (engineAPI.mouseEventCallbacks.wheel.length > 0) {
        engineAPI.mouseEventCallbacks.wheel.forEach(cb => cb({ delta }));
      }
    },
    [engineAPI],
  );

  const mouseEventHandles = useMemo(() => {
    const mouseEvents: {
      [index in keyof Omit<MouseEvents, "wheel">]: undefined | CesiumMouseEvent;
    } & {
      wheel: CesiumMouseWheelEvent | undefined;
    } = {
      click: undefined,
      doubleclick: undefined,
      mousedown: undefined,
      mouseup: undefined,
      rightclick: undefined,
      rightdown: undefined,
      rightup: undefined,
      middleclick: undefined,
      middledown: undefined,
      middleup: undefined,
      mousemove: undefined,
      mouseenter: undefined,
      mouseleave: undefined,
      wheel: (delta: number) => {
        handleMouseWheel(delta);
      },
    };
    (Object.keys(mouseEvents) as (keyof MouseEvents)[]).forEach(type => {
      if (type !== "wheel")
        mouseEvents[type] = (e: CesiumMovementEvent, target: RootEventTarget) => {
          handleMouseEvent(type as keyof MouseEvents, e, target);
        };
    });
    return mouseEvents;
  }, [handleMouseEvent, handleMouseWheel]);

  const handleClick = useCallback(
    async (e: CesiumMovementEvent, target: RootEventTarget) => {
      mouseEventHandles.click?.(e, target);

      if (!(featureFlags & FEATURE_FLAGS.SINGLE_SELECTION)) return;

      // Layer selection from here

      const viewer = cesium.current?.cesiumElement;
      if (!viewer || viewer.isDestroyed()) return;

      prevSelectedImageryFeatureId.current = undefined;

      const entity =
        findEntity(viewer, undefined, selectedLayerId?.featureId) ||
        findEntity(viewer, selectedLayerId?.layerId);

      const tag = getTag(entity);
      if (!entity || (entity instanceof Entity && tag?.hideIndicator)) {
        viewer.selectedEntity = undefined;
      }

      if (target && "id" in target && target.id instanceof Entity && isSelectable(target.id)) {
        const tag = getTag(target.id);
        const layer = tag?.layerId
          ? layersRef?.current?.overriddenLayers().find(l => l.id === tag.layerId) ??
            layersRef?.current?.findById(tag.layerId)
          : undefined;
        onLayerSelect?.(
          tag?.layerId,
          tag?.featureId,
          !!target.id.description || !!target.id.properties
            ? {
                defaultInfobox: {
                  title: layer?.title ?? target.id.name,
                  content: getEntityContent(
                    target.id,
                    viewer.clock.currentTime ?? new JulianDate(),
                    tag?.layerId ? layer?.infobox?.property?.defaultContent : undefined,
                  ),
                },
              }
            : undefined,
        );
        prevSelectedEntity.current = target.id;
        if (target.id instanceof Entity && !tag?.hideIndicator) {
          viewer.selectedEntity = target.id;
        } else {
          viewer.selectedEntity = undefined;
        }
        return;
      }

      if (
        target &&
        (target instanceof Cesium3DTileFeature || target instanceof Cesium3DTilePointFeature)
      ) {
        const tag = getTag(target);
        if (tag) {
          const content = tileProperties(target);
          onLayerSelect?.(
            tag.layerId,
            String(tag.featureId),
            content.length
              ? {
                  defaultInfobox: {
                    title: target.getProperty("name"),
                    content: {
                      type: "table",
                      value: tileProperties(target),
                    },
                  },
                }
              : undefined,
            { feature: tag.computedFeature },
          );
          prevSelectedEntity.current = target;
        }
        return;
      }

      if (
        target &&
        "content" in target &&
        target.content &&
        typeof target.content === "object" &&
        "_model" in target.content &&
        target.content._model instanceof Model
      ) {
        const model = target.content._model;
        const tag = getTag(model);
        if (tag) {
          onLayerSelect?.(tag.layerId, String(tag.featureId));
          prevSelectedEntity.current = model;
        }
        return;
      }

      if (
        target?.primitive &&
        (target.primitive instanceof Primitive || target.primitive instanceof GroundPrimitive)
      ) {
        const primitive = target.primitive;
        const tag = getTag(primitive);
        if (tag) {
          onLayerSelect?.(tag.layerId, String(tag.featureId));
          prevSelectedEntity.current = primitive;
        }
        return;
      }

      // Check imagery layer
      // ref: https://github.com/CesiumGS/cesium/blob/96b978e0c53aba3bc4f1191111e0be61781ae9dd/packages/widgets/Source/Viewer/Viewer.js#L167
      if (target === undefined && e.position) {
        const scene = viewer.scene;
        const pickRay = scene.camera.getPickRay(e.position);

        if (pickRay) {
          const l = await scene.imageryLayers.pickImageryLayerFeatures(pickRay, scene);

          // NOTE: For now we only send the first selected feature to onLayerSelect instead of sending all of them: @pyshx
          const f = l?.[0];

          const appearanceType = f?.data?.appearanceType;

          if (appearanceType && f?.data?.feature?.[appearanceType]?.show !== false) {
            const tag = getTag(f.imageryLayer);

            const pos = f.position;
            if (pos) {
              // NOTE: Instantiate temporal Cesium.Entity to display indicator.
              // Although we want to use `viewer.selectionIndicator.viewModel.position` and `animateAppear`, Cesium reset selection position if `viewer.selectedEntity` is not set.
              // ref: https://github.com/CesiumGS/cesium/blob/9295450e64c3077d96ad579012068ea05f97842c/packages/widgets/Source/Viewer/Viewer.js#L1843-L1876
              // issue: https://github.com/CesiumGS/cesium/issues/7965
              requestAnimationFrame(() => {
                if (!tag?.hideIndicator) {
                  viewer.selectedEntity = new Entity({
                    position: Cartographic.toCartesian(pos),
                  });
                }
              });
            }

            const layer = tag?.layerId
              ? layersRef?.current?.overriddenLayers().find(l => l.id === tag.layerId) ??
                layersRef?.current?.findById(tag.layerId)
              : undefined;
            const content = getEntityContent(
              f.data.feature ?? f,
              viewer.clock.currentTime ?? new JulianDate(),
              tag?.layerId ? layer?.infobox?.property?.defaultContent : undefined,
            );
            prevSelectedImageryFeatureId.current = f.data.featureId;
            onLayerSelect?.(
              f.data.layerId,
              f.data.featureId,
              content.value.length
                ? {
                    defaultInfobox: {
                      title: layer?.title ?? f.name,
                      content,
                    },
                  }
                : undefined,
              {
                feature: f.data.feature,
              },
            );

            return;
          }
        }
      }

      viewer.selectedEntity = undefined;
      onLayerSelect?.();
    },
    [
      onLayerSelect,
      mouseEventHandles,
      layersRef,
      featureFlags,
      selectedLayerId?.featureId,
      selectedLayerId?.layerId,
    ],
  );

  // E2E test
  useEffect(() => {
    if (e2eAccessToken()) {
      setE2ECesiumViewer(cesium.current?.cesiumElement);
      return () => {
        setE2ECesiumViewer(undefined);
      };
    }
    return;
  }, [cesium.current?.cesiumElement]);

  // update
  useEffect(() => {
    const viewer = cesium.current?.cesiumElement;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.scene.requestRender();
  });

  const handleUpdate = useCallback(() => {
    const viewer = cesium.current?.cesiumElement;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.scene.requestRender();
  }, []);

  const { cameraViewBoundaries, cameraViewOuterBoundaries, cameraViewBoundariesMaterial } =
    useCameraLimiter(cesium, camera, property?.cameraLimiter);

  const context = useMemo<FeatureContext>(
    () => ({
      selectionReason,
      timelineManagerRef,
      flyTo: engineAPI.flyTo,
      getCamera: engineAPI.getCamera,
      onLayerEdit,
      onLayerVisibility,
      onLayerLoad,
      requestRender: engineAPI.requestRender,
      getSurfaceDistance: engineAPI.getSurfaceDistance,
      toXYZ: engineAPI.toXYZ,
      toWindowPosition: engineAPI.toWindowPosition,
      isPositionVisible: engineAPI.isPositionVisible,
    }),
    [selectionReason, engineAPI, onLayerEdit, onLayerVisibility, onLayerLoad, timelineManagerRef],
  );

  useEffect(() => {
    if (!cesium.current?.cesiumElement) return;
    const allowCameraMove = !!(featureFlags & FEATURE_FLAGS.CAMERA_MOVE);
    const allowCameraZoom = !!(featureFlags & FEATURE_FLAGS.CAMERA_ZOOM);
    const allowCameraTilt = !!(featureFlags & FEATURE_FLAGS.CAMERA_TILT);
    const allowCameraLook = !!(featureFlags & FEATURE_FLAGS.CAMERA_LOOK);
    cesium.current.cesiumElement.scene.screenSpaceCameraController.enableTranslate =
      allowCameraMove;
    cesium.current.cesiumElement.scene.screenSpaceCameraController.enableRotate = allowCameraMove;
    cesium.current.cesiumElement.scene.screenSpaceCameraController.enableLook = allowCameraLook;
    cesium.current.cesiumElement.scene.screenSpaceCameraController.enableTilt = allowCameraTilt;
    cesium.current.cesiumElement.scene.screenSpaceCameraController.enableZoom = allowCameraZoom;
  }, [featureFlags]);

  const globe = cesium.current?.cesiumElement?.scene.globe;

  useEffect(() => {
    if (globe) {
      const surface = (globe as any)._surface as CustomGlobeSurface;
      if (surface) {
        surface.tileProvider._debug.wireframe = property?.globe?.debug?.showWireframe ?? false;
      }
    }
  }, [globe, property?.globe?.debug?.showWireframe]);

  const onPreRenderCallback = useCallback(
    (scene: Scene) => {
      if (!scene.camera || !cameraForceHorizontalRoll) return;
      if (Math.abs(CesiumMath.negativePiToPi(scene.camera.roll)) > Math.PI / 86400) {
        scene.camera.setView({
          orientation: {
            heading: scene.camera.heading,
            pitch: scene.camera.pitch,
            roll: 0,
          },
        });
      }
    },
    [cameraForceHorizontalRoll],
  );

  useEffect(() => {
    const viewer = cesium.current?.cesiumElement;
    if (!viewer) return;
    return viewer.scene.preRender.addEventListener(onPreRenderCallback);
  }, [onPreRenderCallback]);

  return {
    cesium,
    engineAPI,
    cameraViewBoundaries,
    cameraViewOuterBoundaries,
    cameraViewBoundariesMaterial,
    cesiumIonAccessToken,
    mouseEventHandles,
    context,
    handleMount,
    handleUnmount,
    handleUpdate,
    handleClick,
    layerSelectWithRectEventHandlers,
  };
};

function tileProperties(
  t: Cesium3DTileFeature | Cesium3DTilePointFeature,
): { key: string; value: any }[] {
  return t
    .getPropertyIds()
    .reduce<
      { key: string; value: any }[]
    >((a, b) => [...a, { key: b, value: t.getProperty(b) }], []);
}

function getLayerId(target: RootEventTarget): string | undefined {
  if (target && "id" in target && target.id instanceof Entity) {
    return getTag(target.id)?.layerId;
  } else if (target && target instanceof Cesium3DTileFeature) {
    return getTag(target.tileset)?.layerId;
  }
  return undefined;
}
