import { ArcType, Color, KeyboardEventModifier, ScreenSpaceEventType } from "cesium";
import React, { forwardRef } from "react";
import {
  Viewer,
  Fog,
  Sun,
  SkyAtmosphere,
  Scene,
  SkyBox,
  Camera,
  ScreenSpaceEventHandler,
  ScreenSpaceEvent,
  ScreenSpaceCameraController,
  Entity,
  PolylineGraphics,
  Moon,
} from "resium";

import type { Engine, EngineProps, EngineRef } from "..";

import Cluster from "./Cluster";
import Clock from "./core/Clock";
import Globe from "./core/Globe";
import ImageryLayers from "./core/Imagery";
import Indicator from "./core/Indicator/Indicator";
import LabelImageryLayers from "./core/labels/LabelImageryLayers";
import Event from "./Event";
import Feature, { context as featureContext } from "./Feature";
import useHooks from "./hooks";
import { AmbientOcclusion, AmbientOcclusionOutputType } from "./PostProcesses/hbao";
import { AMBIENT_OCCLUSION_QUALITY } from "./PostProcesses/hbao/config";
import Sketch from "./Sketch";

const Cesium: React.ForwardRefRenderFunction<EngineRef, EngineProps> = (
  {
    className,
    style,
    property,
    camera,
    small,
    ready,
    children,
    selectedLayerId,
    isLayerDraggable,
    isLayerDragging,
    shouldRender,
    layerSelectionReason,
    meta,
    layersRef,
    featureFlags,
    requestingRenderMode,
    timelineManagerRef,
    cameraForceHorizontalRoll,
    onLayerSelect,
    onCameraChange,
    onLayerDrag,
    onLayerDrop,
    onLayerEdit,
    onLayerSelectWithRectStart,
    onLayerSelectWithRectMove,
    onLayerSelectWithRectEnd,
    onMount,
    onLayerVisibility,
    onLayerLoad,
  },
  ref,
) => {
  const {
    backgroundColor,
    cesium,
    cameraViewBoundaries,
    cameraViewOuterBoundaries,
    cameraViewBoundariesMaterial,
    mouseEventHandles,
    cesiumIonAccessToken,
    context,
    sceneLight,
    sceneMsaaSamples,
    layerSelectWithRectEventHandlers,
    handleMount,
    handleUnmount,
    handleUpdate,
    handleClick,
    handleCameraChange,
    handleCameraMoveEnd,
  } = useHooks({
    ref,
    property,
    camera,
    selectedLayerId,
    selectionReason: layerSelectionReason,
    isLayerDraggable,
    isLayerDragging,
    meta,
    layersRef,
    featureFlags,
    requestingRenderMode,
    shouldRender,
    timelineManagerRef,
    cameraForceHorizontalRoll,
    onLayerSelect,
    onCameraChange,
    onLayerDrag,
    onLayerDrop,
    onLayerEdit,
    onLayerSelectWithRectStart,
    onLayerSelectWithRectMove,
    onLayerSelectWithRectEnd,
    onMount,
    onLayerVisibility,
    onLayerLoad,
  });

  return (
    <Viewer
      ref={cesium}
      onUpdate={handleUpdate}
      className={className}
      requestRenderMode={true}
      animation={false}
      timeline={false}
      // NOTE: We need to update cesium ion token dynamically.
      // To replace old imagery provider, we need to remove old imagery provider.
      baseLayer={false}
      fullscreenButton={false}
      homeButton={false}
      geocoder={false}
      infoBox={false}
      baseLayerPicker={false}
      navigationHelpButton={false}
      projectionPicker={false}
      sceneModePicker={false}
      creditContainer={creditContainer}
      style={{
        width: small ? "300px" : "auto",
        height: small ? "300px" : "100%",
        display: ready ? undefined : "none",
        cursor: isLayerDragging ? "grab" : undefined,
        ...style,
      }}
      shadows={!!property?.shadows}
      onClick={handleClick}
      onDoubleClick={mouseEventHandles.doubleclick}
      onMouseDown={mouseEventHandles.mousedown}
      onMouseUp={mouseEventHandles.mouseup}
      onRightClick={mouseEventHandles.rightclick}
      onRightDown={mouseEventHandles.rightdown}
      onRightUp={mouseEventHandles.rightup}
      onMiddleClick={mouseEventHandles.middleclick}
      onMiddleDown={mouseEventHandles.middledown}
      onMiddleUp={mouseEventHandles.middleup}
      onMouseMove={mouseEventHandles.mousemove}
      onMouseEnter={mouseEventHandles.mouseenter}
      onMouseLeave={mouseEventHandles.mouseleave}
      onWheel={mouseEventHandles.wheel}>
      <Event onMount={handleMount} onUnmount={handleUnmount} />
      <Clock timelineManagerRef={timelineManagerRef} />
      <ImageryLayers tiles={property?.tiles} cesiumIonAccessToken={cesiumIonAccessToken} />
      <LabelImageryLayers tileLabels={property?.tileLabels} />
      <Indicator property={property} timelineManagerRef={timelineManagerRef} />
      <ScreenSpaceEventHandler useDefault>
        {/* remove default click event */}
        <ScreenSpaceEvent type={ScreenSpaceEventType.LEFT_CLICK} />
        {/* remove default double click event */}
        <ScreenSpaceEvent type={ScreenSpaceEventType.LEFT_DOUBLE_CLICK} />
      </ScreenSpaceEventHandler>

      {/* For LayerSelectWithRect event */}
      <ScreenSpaceEventHandler>
        <ScreenSpaceEvent
          type={ScreenSpaceEventType.LEFT_DOWN}
          action={layerSelectWithRectEventHandlers.start.handler}
        />
        <ScreenSpaceEvent
          type={ScreenSpaceEventType.LEFT_DOWN}
          modifier={KeyboardEventModifier.SHIFT}
          action={layerSelectWithRectEventHandlers.start.shift}
        />
        <ScreenSpaceEvent
          type={ScreenSpaceEventType.MOUSE_MOVE}
          action={layerSelectWithRectEventHandlers.move.handler}
        />
        <ScreenSpaceEvent
          type={ScreenSpaceEventType.MOUSE_MOVE}
          modifier={KeyboardEventModifier.SHIFT}
          action={layerSelectWithRectEventHandlers.move.shift}
        />
        <ScreenSpaceEvent
          type={ScreenSpaceEventType.LEFT_UP}
          action={layerSelectWithRectEventHandlers.end.handler}
        />
        <ScreenSpaceEvent
          type={ScreenSpaceEventType.LEFT_UP}
          modifier={KeyboardEventModifier.SHIFT}
          action={layerSelectWithRectEventHandlers.end.shift}
        />
      </ScreenSpaceEventHandler>
      <ScreenSpaceCameraController
        maximumZoomDistance={
          property?.cameraLimiter?.cameraLimitterEnabled
            ? property.cameraLimiter?.cameraLimitterTargetArea?.height ?? Number.POSITIVE_INFINITY
            : Number.POSITIVE_INFINITY
        }
        enableCollisionDetection={!property?.camera?.allowEnterGround}
      />
      <Camera
        onChange={handleCameraChange}
        percentageChanged={0.2}
        onMoveEnd={handleCameraMoveEnd}
      />
      {cameraViewBoundaries && property?.cameraLimiter?.cameraLimitterShowHelper && (
        <Entity>
          <PolylineGraphics
            positions={cameraViewBoundaries}
            width={1}
            material={Color.RED}
            arcType={ArcType.RHUMB}
          />
        </Entity>
      )}
      {cameraViewOuterBoundaries && property?.cameraLimiter?.cameraLimitterShowHelper && (
        <Entity>
          <PolylineGraphics
            positions={cameraViewOuterBoundaries}
            width={1}
            material={cameraViewBoundariesMaterial}
            arcType={ArcType.RHUMB}
          />
        </Entity>
      )}
      <Scene
        backgroundColor={backgroundColor}
        light={sceneLight}
        msaaSamples={sceneMsaaSamples}
        useDepthPicking={false}
        useWebVR={!!property?.scene?.vr || undefined} // NOTE: useWebVR={false} will crash Cesium
        debugShowFramesPerSecond={!!property?.scene?.debugShowFramesPerSecond}
        verticalExaggerationRelativeHeight={property?.scene?.verticalExaggerationRelativeHeight}
        verticalExaggeration={property?.scene?.verticalExaggeration}
      />
      <SkyBox show={property?.skyBox?.show ?? true} />
      <Fog enabled={property?.fog?.enabled ?? true} density={property?.fog?.density} />
      <Sun show={property?.sun?.show ?? true} />
      <Moon show={property?.moon?.show ?? true} />
      <SkyAtmosphere
        show={property?.skyAtmosphere?.show ?? true}
        atmosphereLightIntensity={property?.skyAtmosphere?.atmosphereLightIntensity}
        saturationShift={property?.skyAtmosphere?.saturationShift}
        brightnessShift={property?.skyAtmosphere?.brightnessShift}
      />
      <Globe property={property} cesiumIonAccessToken={cesiumIonAccessToken} />
      <featureContext.Provider value={context}>{ready ? children : null}</featureContext.Provider>
      <AmbientOcclusion
        {...AMBIENT_OCCLUSION_QUALITY[property?.ambientOcclusion?.quality || "low"]}
        enabled={!!property?.ambientOcclusion?.enabled}
        intensity={property?.ambientOcclusion?.intensity ?? 100}
        outputType={
          property?.ambientOcclusion?.ambientOcclusionOnly
            ? AmbientOcclusionOutputType.Occlusion
            : null
        }
      />
    </Viewer>
  );
};

const creditContainer = document.createElement("div");

const Component = forwardRef(Cesium);

export default Component;

export const engine: Engine = {
  component: Component,
  featureComponent: Feature,
  clusterComponent: Cluster,
  sketchComponent: Sketch,
  delegatedDataTypes: ["czml", "wms", "mvt", "3dtiles", "osm-buildings", "kml"],
};
