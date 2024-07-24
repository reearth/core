import { useCallback, useRef, useState } from "react";

import { CoreVisualizer, MapRef } from "@reearth/core";

import { VIEWER } from "./scene";
import { TEST_LAYERS } from "./testLayers";
import { CESIUM_ION_ACCESS_TOKEN } from "./token";

function App() {
  const ref = useRef<MapRef>(null);
  const [isReady, setIsReady] = useState(false);
  const handleMount = useCallback(() => {
    requestAnimationFrame(() => {
      setIsReady(true);
    });
  }, []);

  const camera = {
    fov: 1.0471975511965976,
    heading: 6.075482442126033,
    height: 4065.852019268935,
    lat: 35.608034008903225,
    lng: 139.7728554580092,
    pitch: -0.45804512978428535,
    roll: 6.2830631767616465,
  };

  // TODO: use onLayerSelect props (core should export a type for selection).
  const handleSelect = useCallback(() => {
    console.log("Selected feature: ", ref.current?.layers.selectedFeature());
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
      }}>
      <CoreVisualizer
        ref={ref}
        ready={isReady}
        onMount={handleMount}
        onLayerSelect={handleSelect}
        engine="cesium"
        meta={{
          cesiumIonAccessToken: CESIUM_ION_ACCESS_TOKEN || undefined,
        }}
        // FIXME: Terrain isn't rendered in initial render.
        viewerProperty={isReady ? VIEWER : undefined}
        camera={camera}
        layers={[
          {
            id: "marker",
            type: "simple",
            data: {
              type: "geojson",
              value: {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    properties: {
                      index: 1,
                    },
                    geometry: {
                      coordinates: [139.75299772754948, 35.68523972679557],
                      type: "Point",
                    },
                  },
                  {
                    type: "Feature",
                    properties: {
                      index: 2,
                    },
                    geometry: {
                      coordinates: [139.8327378666679, 35.67919002820361],
                      type: "Point",
                    },
                  },
                  {
                    type: "Feature",
                    properties: {
                      index: 3,
                    },
                    geometry: {
                      coordinates: [139.69716359812975, 35.70030560455889],
                      type: "Point",
                    },
                  },
                ],
              },
            },
            marker: {
              imageColor: {
                expression: {
                  conditions: [
                    ["${index} === 1", "color('#FF0000')"],
                    ["${index} === 2", "color('#00FF00')"],
                    ["true", "color('#000000')"],
                  ],
                },
              },
            },
          },
          ...TEST_LAYERS,
        ]}
      />
    </div>
  );
}

export default App;
