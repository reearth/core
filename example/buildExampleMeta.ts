import {
  createCustomConfig,
  createTerravistaConfig,
  TileProviderConfig,
} from "@reearth/core";

// terrain.reearth.land doesn't send CORS headers, so in dev we route through the
// Vite proxy (/terrain-proxy) defined in vite.config.example.ts.
function toTerrainUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (import.meta.env.DEV) return url.replace("https://terrain.reearth.land", "/terrain-proxy");
  return url;
}

/**
 * Build TileProviderConfig from example env vars.
 *
 * In dev (yarn dev) we append ?token= so tiles work without Sentinel.
 * In production the visualizer registers Sentinel which injects Bearer headers instead.
 *
 * Returns a Terravista config when a token is present, otherwise a public OSM fallback.
 */
export function buildExampleTileProvider(): TileProviderConfig {
  const token: string | undefined =
    import.meta.env.EXAMPLE_TERRAVISTA_ACCESS_TOKEN || undefined;
  const t = token ? `?token=${token}` : "";

  if (token) {
    return createTerravistaConfig(token, {
      baseUrl: import.meta.env.EXAMPLE_TERRAVISTA_BASE_URL || undefined,
      imageryTileOverrides: [
        {
          id: "default",
          url: `${import.meta.env.EXAMPLE_TERRAVISTA_IMAGERY_DEFAULT_URL}${t}`,
          credit:
            import.meta.env.EXAMPLE_TERRAVISTA_IMAGERY_DEFAULT_CREDIT ||
            "© Google",
        },
        {
          id: "default_road",
          url: `${import.meta.env.EXAMPLE_TERRAVISTA_IMAGERY_ROAD_URL}${t}`,
          credit:
            import.meta.env.EXAMPLE_TERRAVISTA_IMAGERY_ROAD_CREDIT ||
            "© Google",
        },
        {
          id: "black_marble",
          url: `${import.meta.env.EXAMPLE_TERRAVISTA_IMAGERY_BLACK_MARBLE_URL}${t}`,
          credit:
            import.meta.env.EXAMPLE_TERRAVISTA_IMAGERY_BLACK_MARBLE_CREDIT ||
            "NASA GIBS VIIRS",
          maxZoomLevel: 8,
        },
      ],
      terrainOverrides: [
        {
          id: "default",
          url: toTerrainUrl(import.meta.env.EXAMPLE_REEARTH_TERRAIN_URL),
        },
      ],
      layerSourceOverrides: [
        {
          id: "googlePhotorealistic",
          url: `${import.meta.env.EXAMPLE_TERRAVISTA_GOOGLE3D_URL}${t}`,
        },
      ],
    });
  }

  // No token — fall back to public OSM tiles.
  return createCustomConfig({
    imageryTileOverrides: [
      {
        id: "default",
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        credit: "© OpenStreetMap contributors",
      },
      {
        id: "default_road",
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        credit: "© OpenStreetMap contributors",
      },
    ],
    terrainOverrides: [],
  });
}
