import { SketchType } from "@reearth/core";

export const DEFAULT_LAYERS: string[] = [];

export const DEFAULT_CAMERA = {
  fov: 1.0471975511965976,
  heading: 6.075482442126033,
  height: 4065.852019268935,
  lat: 35.608034008903225,
  lng: 139.7728554580092,
  pitch: -0.45804512978428535,
  roll: 6.2830631767616465,
};

// Static preset tile types — always available regardless of CustomProviderConfig.
// Dynamic provider IDs (from EXAMPLE_IMAGERY_PROVIDERS) are appended at runtime in hooks.ts.
export const TILES = [
  // Public (always available)
  "open_street_map",
  "japan_gsi_standard",
  "stamen_watercolor",
  "carto_light",
  // Cesium Ion — custom asset ID (enter asset ID in the input below)
  "cesium_ion",
  // Cesium Ion — preset assets (requires user-provided Ion token in scene settings)
  "cesium_ion_default",
  "cesium_ion_labelled",
  "cesium_ion_road",
  "cesium_ion_earth_at_night",
];

export const SKETCH_TOOLS: SketchType[] = [
  "marker",
  "polyline",
  "circle",
  "rectangle",
  "polygon",
  "extrudedCircle",
  "extrudedRectangle",
  "extrudedPolygon",
];
