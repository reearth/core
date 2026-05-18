/**
 * Tile Provider Configuration Types
 * ---------------------------------
 * These types allow configuring different tile service providers
 * in a provider-agnostic way, making @reearth/core work with
 * various backends (Terravista or custom servers).
 *
 * Note: Cesium Ion is not configured here. When users select cesiumion
 * terrain in the editor, the token flows through meta.cesiumIonAccessToken.
 */

/**
 * A single tile source override — the unit passed from visualizer to core.
 * Visualizer constructs these from env vars; core only consumes them.
 */
export interface TileOverride {
  /** Identifier matched against preset names (e.g. 'default', 'black_marble', 'googlePhotorealistic') */
  id: string;
  url: string;
  credit?: string;
  maxZoomLevel?: number;
}

/**
 * Tile Provider Configuration
 * All URL content comes from the consuming application (visualizer) via override arrays.
 * Core never generates or hard-codes tile URLs.
 */
export interface TileProviderConfig {
  /**
   * Provider type
   * - 'terravista': Use Terravista (requires Sentinel authentication)
   * - 'custom': Fully custom URLs
   */
  type: "terravista" | "custom";

  /**
   * Base URL reference (informational, not used for URL generation inside core)
   * @example 'https://tiles.eukarya.io'
   */
  baseUrl?: string;

  /**
   * Authentication configuration
   */
  auth?: TileProviderAuth;

  /**
   * Imagery tile overrides — keyed by preset id (e.g. 'default', 'default_road', 'black_marble')
   */
  imageryTileOverrides?: TileOverride[];

  /**
   * Terrain overrides — typically a single entry with id 'default'
   */
  terrainOverrides?: TileOverride[];

  /**
   * Layer source overrides — for 3D tilesets (e.g. id 'googlePhotorealistic')
   */
  layerSourceOverrides?: TileOverride[];
}

/**
 * Authentication configuration
 */
export interface TileProviderAuth {
  /**
   * Authentication type
   * - 'bearer': Bearer token (Terravista style)
   * - 'query-param': URL query parameter
   */
  type: "bearer" | "query-param";

  /**
   * Access Token
   * - For 'bearer': Terravista token
   * - For 'query-param': Will be appended to URL
   */
  accessToken?: string;

  /**
   * Token expiration timestamp (milliseconds since epoch)
   */
  expiresAt?: number;

  /**
   * Token refresh callback
   */
  onTokenExpired?: () => Promise<{ accessToken: string; expiresAt?: number }>;

  /**
   * Query parameter name (for 'query-param' type)
   * @default 'token'
   */
  queryParamName?: string;
}
