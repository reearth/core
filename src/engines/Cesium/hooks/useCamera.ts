import { Viewer } from "cesium";
import { isEqual } from "lodash-es";
import { useCallback, useEffect, useRef } from "react";
import { CesiumComponentRef } from "resium";
import { RefObject } from "use-callback-ref/dist/es5/types";

import { EngineRef } from "../..";
import { Camera } from "../../../mantle";
import { getCamera } from "../common";

export default ({
  cesium,
  camera,
  engineAPI,
  onCameraChange,
}: {
  cesium: RefObject<CesiumComponentRef<Viewer>>;
  engineAPI: EngineRef;
  camera?: Camera;
  onCameraChange?: (camera: Camera) => void;
}) => {
  // cache the camera data emitted from viewer camera change
  const emittedCamera = useRef<Camera[]>([]);
  const updateCamera = useCallback(() => {
    const viewer = cesium?.current?.cesiumElement;
    if (!viewer || viewer.isDestroyed() || !onCameraChange) return;

    const c = getCamera(viewer);
    if (c && !isEqual(c, camera)) {
      emittedCamera.current.push(c);
      // The state change is not sync now. This number is how many state updates can actually happen to be merged within one re-render.
      if (emittedCamera.current.length > 10) {
        emittedCamera.current.shift();
      }
      onCameraChange?.(c);
    }
  }, [cesium, camera, onCameraChange]);

  const handleCameraChange = useCallback(() => {
    updateCamera();
  }, [updateCamera]);

  const handleCameraMoveEnd = useCallback(() => {
    updateCamera();
  }, [updateCamera]);

  useEffect(() => {
    if (camera && !emittedCamera.current.includes(camera)) {
      engineAPI.flyTo(camera, { duration: 0 });
      emittedCamera.current = [];
    }
  }, [camera, engineAPI]);

  return {
    handleCameraChange,
    handleCameraMoveEnd,
  };
};
