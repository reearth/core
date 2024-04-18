import { Visualizer } from "../../src/index";

function App() {
  return (
    <Visualizer
      ready={true}
      engine="cesium"
      sceneProperty={{
        tiles: [
          {
            id: "default",
            tile_type: "default",
          },
        ],
      }}
    />
  );
}

export default App;
