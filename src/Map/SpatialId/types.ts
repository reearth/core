import { Space } from "@reearth/spatial-id-sdk";

export type SpatialIdSpaceType = {
  id: string;
  space: Space;
  wsen: [number, number, number, number];
  height: number;
  extrudedHeight: number;
  type?: "selector" | "floor" | "coordinate" | "confirmed";
  color?: string;
};

export type SpatialIdPickSpaceOptions = {
  zoom?: number;
  maxHeight?: number;
  color?: string;
  dataOnly?: boolean;
  rightClickToExit?: boolean;
};

export type SpatialIdRef = {
  pickSpace: (options?: SpatialIdPickSpaceOptions) => void;
  exitPickSpace: () => void;
  onSpacePick: (cb: (space: SpatialIdSpaceData) => void) => void;
};

export type SpatialIdSpacePickingState = "idle" | "coordinate" | "floor";

export type SpatialIdSpaceData = {
  id: string;
  center: { lat: number; lng: number; alt?: number };
  alt: number;
  zoom: number;
  zfxy: {
    z: number;
    f: number;
    x: number;
    y: number;
  };
  zfxyStr: string;
  tilehash: string;
  hilbertTilehash: string;
  hilbertIndex: string;
  vertices: [number, number, number][];
};
