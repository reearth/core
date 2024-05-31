import { Cartesian3, Color, DirectionalLight, SceneMode, SunLight, Viewer } from "cesium";
import { RefObject, useMemo } from "react";
import { CesiumComponentRef } from "resium";

import { SceneProperty } from "../..";

export default ({
  cesium,
  property,
}: {
  cesium: RefObject<CesiumComponentRef<Viewer>>;
  property?: SceneProperty;
}) => {
  const sceneLight = useMemo(() => {
    let light;
    if (property?.scene?.light?.type === "sunLight") {
      light = new SunLight({
        color: property.scene?.light?.color
          ? Color.fromCssColorString(property.scene.light.color)
          : undefined,
        intensity: property.scene?.light?.intensity,
      });
    } else if (property?.scene?.light?.type === "directionalLight") {
      light = new DirectionalLight({
        direction: new Cartesian3(
          property?.scene?.light?.directionX ?? 1,
          property?.scene?.light?.directionY ?? 0,
          property?.scene?.light?.directionZ ?? 0,
        ),
        color: property.scene?.light?.color
          ? Color.fromCssColorString(property.scene.light.color)
          : undefined,
        intensity: property.scene?.light?.intensity,
      });
    } else {
      light = cesium.current?.cesiumElement?.scene.light;
      if (light) {
        light.color = property?.scene?.light?.color
          ? Color.fromCssColorString(property.scene.light.color)
          : light.color;
        light.intensity = property?.scene?.light?.intensity
          ? property.scene.light.intensity
          : light.intensity;
      }
    }
    return light;
  }, [
    cesium,
    property?.scene?.light?.type,
    property?.scene?.light?.color,
    property?.scene?.light?.directionX,
    property?.scene?.light?.directionY,
    property?.scene?.light?.directionZ,
    property?.scene?.light?.intensity,
  ]);

  const sceneBackgroundColor = useMemo(
    () =>
      property?.scene?.backgroundColor
        ? Color.fromCssColorString(property.scene.backgroundColor)
        : undefined,
    [property?.scene?.backgroundColor],
  );

  const sceneMsaaSamples = useMemo(() => {
    // TODO: FXAA doesn't support alpha blending in Cesium, so we will enable FXAA when this is fixed.
    // viewer.scene.postProcessStages.fxaa.enabled = property?.render?.antialias === "high";
    return property?.scene?.antialias === "extreme"
      ? 8
      : property?.scene?.antialias === "high"
        ? 6
        : property?.scene?.antialias === "medium"
          ? 4
          : 1;
  }, [property?.scene?.antialias]);

  const sceneMode = useMemo(() => {
    return property?.scene?.mode === "2d"
      ? SceneMode.SCENE2D
      : property?.scene?.mode === "columbus"
        ? SceneMode.COLUMBUS_VIEW
        : SceneMode.SCENE3D;
  }, [property?.scene?.mode]);

  return {
    sceneLight,
    sceneBackgroundColor,
    sceneMsaaSamples,
    sceneMode,
  };
};
