import { Layer } from "@reearth/core";

import { GEOJSON_MARKER } from "./geojson_marker";
import { GEOJSON_SIMPLE } from "./geojson_simple";
import { LAND_USE } from "./mvt";

export const TEST_LAYERS: Layer[] = [LAND_USE, GEOJSON_MARKER, GEOJSON_SIMPLE];
