import { useCallback, useRef, useState } from "react";

import { CoreVisualizer, MapRef } from "@reearth/core";

import { TEST_LAYERS } from "./testLayers";

function App() {
  const ref = useRef<MapRef>(null);
  const [isReady, setIsReady] = useState(false);
  const handleMount = useCallback(() => {
    setIsReady(true);
  }, []);

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
        sceneProperty={{
          scene: {
            mode: "2d",
          },
          tiles: [
            {
              id: "default",
              type: "default",
            },
          ],
        }}
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
