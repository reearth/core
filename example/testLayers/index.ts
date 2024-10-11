import { Layer } from "@reearth/core";

import { GEOJSON_MARKER } from "./geojson_marker";
import { GEOJSON_SIMPLE } from "./geojson_simple";
import { GOOGLE_PHOTOREALISTIC_3DTILES } from "./google_photorealistic_3dtiles";
import { LAND_USE } from "./mvt";
import { OSM_BUILDINGS } from "./osm_buildings";
import { THREEDTILES_SIMPLE } from "./threedtiles_simple";

export const TEST_LAYERS: Layer[] = [
  LAND_USE,
  GEOJSON_MARKER,
  GEOJSON_SIMPLE,
  GOOGLE_PHOTOREALISTIC_3DTILES,
  OSM_BUILDINGS,
  THREEDTILES_SIMPLE,
];
