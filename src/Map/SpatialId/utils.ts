import { Space } from "@spatial-id/javascript-sdk";
import { v4 as uuid } from "uuid";

import { SPATIALID_DEFAULT_COLOR, SPATIALID_DEFAULT_MAX_HEIGHT } from "./hooks";
import { SpatialIdSpaceType, SpatialIdSpaceData } from "./types";

const getRectangeParamsFromSpace = (space: Space) => {
  const vertices = space.vertices3d();
  const wsen: [number, number, number, number] = [
    vertices[0][0],
    vertices[1][1],
    vertices[2][0],
    vertices[3][1],
  ];
  const height = vertices[0][2];
  const extrudedHeight = vertices[4][2];
  return { wsen, height, extrudedHeight };
};

export const createSpatialIdSpace = (
  lng: number,
  lat: number,
  alt: number,
  zoom: number,
): SpatialIdSpaceType => {
  const space = new Space({ lat, lng, alt }, zoom);
  const { wsen, height, extrudedHeight } = getRectangeParamsFromSpace(space);

  return {
    id: uuid(),
    space,
    wsen,
    height,
    extrudedHeight,
  };
};

export const createSpatialIdFloorSpaces = (
  space: Space,
  maxHeight = SPATIALID_DEFAULT_MAX_HEIGHT,
  color = SPATIALID_DEFAULT_COLOR,
) => {
  const floorSpaces: SpatialIdSpaceType[] = [];
  const { height, extrudedHeight } = getRectangeParamsFromSpace(space);
  const heightStep = extrudedHeight - height;
  for (let h = 0; h < maxHeight; h += heightStep) {
    const fSpace = new Space({ lat: space.center.lat, lng: space.center.lng, alt: h }, space.zoom);
    const {
      wsen: fWsen,
      height: fHeight,
      extrudedHeight: fExtrudedHeight,
    } = getRectangeParamsFromSpace(fSpace);
    floorSpaces.push({
      id: uuid(),
      space: fSpace,
      wsen: fWsen,
      height: fHeight,
      extrudedHeight: fExtrudedHeight,
      type: "floor",
      color,
    });
  }
  return floorSpaces;
};

export const getSpaceData = (space: Space): SpatialIdSpaceData => {
  return {
    id: space.id,
    center: space.center,
    alt: space.alt,
    zoom: space.zoom,
    zfxy: space.zfxy,
    zfxyStr: space.zfxyStr,
    tilehash: space.tilehash,
    hilbertTilehash: space.hilbertTilehash,
    hilbertIndex: space.hilbertIndex.toString(),
    vertices: space.vertices3d(),
  };
};
