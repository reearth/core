import { CoreVisualizer } from "@reearth/core";

function App() {
  return (
    <div style={{
      position: "relative",
      width: "100vw",
      height: '100vh',
    }}>
      <CoreVisualizer
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
    </div>
    
  );
}

export default App;
