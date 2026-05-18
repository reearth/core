import { Layer } from "@reearth/core";

import { CZML_SIMPLE } from "./czml_simple";
import { GEOJSON_MARKER } from "./geojson_marker";
import { GEOJSON_SIMPLE } from "./geojson_simple";
import { GOOGLE_PHOTOREALISTIC_3DTILES } from "./google_photorealistic_3dtiles";
import { LAND_USE, LSLD_SAPPORO, LSLD_NIJIMA } from "./mvt";
import { OSM_BUILDINGS } from "./osm_buildings";
import { REEARTH_BUILDINGS } from "./reearth_buildings";
import { THREEDTILES_KUMAGAYA_LOD2 } from "./threedtiles_lod2";
import { THREEDTILES_SIMPLE } from "./threedtiles_simple";
import { THREEDTILES_SIMPLE_WITH_STYLE_URL } from "./threedtiles_simple_with_style_url";

export const TEST_LAYERS: Layer[] = [
  LAND_USE,
  LSLD_SAPPORO,
  LSLD_NIJIMA,
  GEOJSON_MARKER,
  GEOJSON_SIMPLE,
  GOOGLE_PHOTOREALISTIC_3DTILES,
  OSM_BUILDINGS,
  REEARTH_BUILDINGS,
  THREEDTILES_SIMPLE,
  THREEDTILES_SIMPLE_WITH_STYLE_URL,
  THREEDTILES_KUMAGAYA_LOD2,
  CZML_SIMPLE,
];
