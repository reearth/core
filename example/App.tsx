import { useCallback, useMemo, useRef, useState } from "react";

import { CoreVisualizer, MapRef } from "@reearth/core";

import { VIEWER } from "./scene";
import { TEST_LAYERS } from "./testLayers";
import { CESIUM_ION_ACCESS_TOKEN } from "./token";

import "@/global.css";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

const TILES = [
  "default",
  "default_label",
  "default_road",
  "open_street_map",
  "esri_world_topo",
  "black_marble",
  "japan_gsi_standard",
];

const DEFAULT_TILE = "open_street_map";

const DEFAULT_LAYERS = ["land_use_mvt", "geojson_marker"];

const DEFAULT_CAMERA = {
  fov: 1.0471975511965976,
  heading: 6.075482442126033,
  height: 4065.852019268935,
  lat: 35.608034008903225,
  lng: 139.7728554580092,
  pitch: -0.45804512978428535,
  roll: 6.2830631767616465,
};

function App() {
  const ref = useRef<MapRef>(null);
  const [isReady, setIsReady] = useState(false);
  const handleMount = useCallback(() => {
    requestAnimationFrame(() => {
      setIsReady(true);
    });
  }, []);

  // TODO: use onLayerSelect props (core should export a type for selection).
  const handleSelect = useCallback(() => {
    console.log("Selected feature: ", ref.current?.layers.selectedFeature());
  }, []);

  const [currentTile, setCurrentTile] = useState(DEFAULT_TILE);
  const [currentCamera, setCurrentCamera] = useState(DEFAULT_CAMERA);
  const [terrainEnabled, setTerrainEnabled] = useState(true);
  const [activeLayerIds, setActiveLayerIds] = useState<string[]>(DEFAULT_LAYERS);

  const viewerProperty = useMemo(
    () => ({
      ...VIEWER,
      tiles: [
        {
          id: "asdflajslf",
          type: currentTile,
          opacity: 1,
        },
      ],
      terrain: {
        ...VIEWER.terrain,
        enabled: terrainEnabled,
      },
    }),
    [currentTile, terrainEnabled],
  );

  const layers = useMemo(
    () => TEST_LAYERS.filter(layer => activeLayerIds.includes(layer.id)),
    [activeLayerIds],
  );

  const meta = useMemo(
    () => ({
      cesiumIonAccessToken: CESIUM_ION_ACCESS_TOKEN || undefined,
    }),
    [],
  );

  return (
    <>
      <div className="tw-absolute tw-right-2 tw-top-2 tw-z-10">
        <Sheet>
          <SheetTrigger className="tw-bg-white tw-rounded-sm tw-pl-2 tw-pr-2">Options</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Tile</SheetTitle>
              <Select value={currentTile} onValueChange={setCurrentTile}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TILES.map(tile => (
                    <SelectItem key={tile} value={tile}>
                      {tile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Separator />
              <SheetTitle>Terrain</SheetTitle>
              <div className="tw-flex tw-items-center tw-gap-2 tw-justify-between tw-w-full">
                <label className="tw-text-sm tw-font-medium tw-leading-none tw-opacity-70">
                  Enabled
                </label>
                <Switch checked={terrainEnabled} onCheckedChange={setTerrainEnabled} />
              </div>
              <Separator />
              <SheetTitle>Layers</SheetTitle>
              {TEST_LAYERS.map(layer => (
                <div key={layer.id} className="tw-flex tw-items-center tw-gap-2">
                  <Checkbox
                    checked={activeLayerIds.includes(layer.id)}
                    onCheckedChange={() => {
                      setActiveLayerIds(ids =>
                        ids.includes(layer.id)
                          ? ids.filter(id => id !== layer.id)
                          : [...ids, layer.id],
                      );
                    }}
                  />
                  <label className="tw-text-sm tw-font-medium tw-leading-none tw-opacity-70">
                    {layer.id}
                  </label>
                </div>
              ))}
            </SheetHeader>
            <SheetDescription />
          </SheetContent>
        </Sheet>
      </div>
      <div className="tw-w-screen tw-h-screen">
        <CoreVisualizer
          ref={ref}
          ready={isReady}
          onMount={handleMount}
          onLayerSelect={handleSelect}
          engine="cesium"
          meta={meta}
          viewerProperty={isReady ? viewerProperty : undefined}
          camera={currentCamera}
          onCameraChange={setCurrentCamera}
          layers={layers}
        />
      </div>
    </>
  );
}

export default App;
