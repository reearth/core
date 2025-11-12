/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TYPES TO MOVE TO VISUALIZER PACKAGE
 *
 * This file contains all the types that are being removed from @reearth/core
 * and should be moved to the Visualizer package instead.
 *
 * Copy these types to your Visualizer package (e.g., packages/visualizer/src/types/infobox.ts)
 * before upgrading Core to 0.1.0-beta.0
 */

// =============================================================================
// INFOBOX TYPES (from src/reearthTypes.ts)
// =============================================================================

/**
 * Infobox configuration for a layer
 * Contains property settings and content blocks for the infobox UI
 */
export type Infobox<BP = any> = {
  /** Unique identifier for the infobox */
  id?: string;
  /** UI property configuration */
  property?: InfoboxProperty;
  /** Content blocks to display in the infobox */
  blocks?: InfoboxBlock<BP>[];
  /** ID of the selected feature this infobox is associated with */
  featureId?: string;
};

/**
 * Infobox UI property configuration
 * Controls the visual presentation and layout of the infobox
 */
export type InfoboxProperty = {
  /** Position of the infobox on screen */
  position?: "right" | "left";
  /** Size preset for the infobox */
  size?: "small" | "medium" | "large";
  /** How height is determined */
  heightType?: "auto" | "manual";
  /** Outline color (CSS color string) */
  outlineColor?: string;
  /** Outline width in pixels */
  outlineWidth?: number;
  /** Internal padding */
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  /** Gap between blocks in pixels */
  gap?: number;
  /** Background color (CSS color string) */
  bgcolor?: string;
  /** Typography settings object */
  typography?: object;
  /**
   * @deprecated Legacy field for Crust compatibility
   * Determines what content to show by default:
   * - "description": Show feature description
   * - "attributes": Show feature properties as table
   */
  defaultContent?: "description" | "attributes";
};

/**
 * Infobox content block
 * Represents a single content block in the infobox, typically rendered by a plugin
 */
export type InfoboxBlock<P = any> = {
  /** Unique identifier for the block */
  id: string;
  /** Display name of the block */
  name?: string;
  /** Crust plugin ID that renders this block */
  pluginId?: string;
  /** Crust extension ID within the plugin */
  extensionId?: string;
  /** Custom properties for the block */
  property?: P;
  /** ID of the property definition */
  propertyId?: string;
};

/**
 * Generic property item with UI metadata
 * Used for form fields and property editors
 */
export type PropertyItem<T> = {
  /** Unique identifier */
  id?: string;
  /** Property type (e.g., "string", "number", "bool") */
  type?: string;
  /** UI component type (e.g., "text", "select", "color") */
  ui?: string;
  /** Human-readable title */
  title?: string;
  /** Help text or description */
  description?: string;
  /** Available choices for select/radio inputs */
  choices?: { key: string; label: string }[];
  /** Current value */
  value?: T;
};

/**
 * Value type enum (from GraphQL schema)
 * Defines possible value types for properties
 */
export enum ValueType {
  BOOL = "bool",
  LATLNG = "latlng",
  LATLNGHEIGHT = "latlngheight",
  NUMBER = "number",
  COORDINATES = "coordinates",
  POLYGON = "polygon",
  RECT = "rect",
  REF = "ref",
  STRING = "string",
  URL = "url",
}

// =============================================================================
// DEFAULT INFOBOX TYPES (from src/Map/Layers/hooks.ts)
// =============================================================================

/**
 * Default infobox content generated from feature properties
 * This is what Core used to generate automatically, now Visualizer should create it
 */
export type DefaultInfobox = {
  /** Title to display in the infobox */
  title?: string;
  /** Content to display */
  content:
    | {
        /** Table format - displays key-value pairs */
        type: "table";
        value: { key: string; value: string }[];
      }
    | {
        /** HTML format - displays raw HTML */
        type: "html";
        value: string;
      };
};

// =============================================================================
// NAIVE TYPES (from src/mantle/types/index.ts)
// =============================================================================

/**
 * Naive infobox - infobox without ID (used for creation)
 */
export type NaiveInfobox = Omit<Infobox, "id" | "blocks"> & {
  blocks?: NaiveBlock[];
};

/**
 * Naive block - block without ID (used for creation)
 */
export type NaiveBlock<P = any> = Omit<InfoboxBlock<P>, "id">;

// =============================================================================
// SELECTION REASON TYPES (from src/Map/Layers/hooks.ts)
// =============================================================================
// Note: These types remain in Core but without the defaultInfobox field
// Include them here for reference on what was removed

/**
 * REMOVED FIELD from LayerSelectionReason:
 * defaultInfobox?: DefaultInfobox
 *
 * Visualizer should now generate this content instead of receiving it from Core
 */

/**
 * REMOVED FIELD from FeatureSelectionReason:
 * defaultInfobox?: DefaultInfobox
 *
 * Visualizer should now generate this content instead of receiving it from Core
 */

// =============================================================================
// UTILITY FUNCTIONS TO IMPLEMENT IN VISUALIZER
// =============================================================================

/**
 * Example utility: Generate default infobox from feature properties
 * Implement this in your Visualizer package to replace Core's defaultInfobox generation
 */
export function generateDefaultInfobox(
  layerTitle?: string,
  featureProperties?: Record<string, any>,
): DefaultInfobox | undefined {
  if (!featureProperties) return undefined;

  const properties = Object.entries(featureProperties)
    .filter(([_, value]) => value != null)
    .map(([key, value]) => ({
      key,
      value: String(value),
    }));

  if (properties.length === 0) return undefined;

  return {
    title: layerTitle,
    content: {
      type: "table",
      value: properties,
    },
  };
}

/**
 * Example utility: Convert HTML description to infobox content
 */
export function descriptionToInfobox(description: string, title?: string): DefaultInfobox {
  return {
    title,
    content: {
      type: "html",
      value: description,
    },
  };
}

/**
 * Example utility: Determine infobox content type based on InfoboxProperty.defaultContent
 * This replaces the logic in Core's convertEntityContent function
 */
export function getDefaultInfoboxContent(
  defaultContent: InfoboxProperty["defaultContent"],
  description?: string,
  properties?: Record<string, any>,
): DefaultInfobox["content"] | undefined {
  switch (defaultContent) {
    case "description":
      if (!description) return undefined;
      return { type: "html", value: description };

    case "attributes":
    default: {
      if (!properties) return undefined;
      const entries = Object.entries(properties).map(([key, value]) => ({
        key,
        value: String(value ?? ""),
      }));
      if (entries.length === 0) return undefined;
      return { type: "table", value: entries };
    }
  }
}

// =============================================================================
// MIGRATION NOTES
// =============================================================================

/**
 * STEPS TO MIGRATE:
 *
 * 1. Copy all types above to your Visualizer package
 *    Example location: packages/visualizer/src/types/infobox.ts
 *
 * 2. Create a VisualizerLayer type that extends Core's Layer:
 *    ```typescript
 *    import { Layer } from "@reearth/core";
 *    export type VisualizerLayer = Layer & { infobox?: Infobox };
 *    ```
 *
 * 3. Update selection callbacks to generate defaultInfobox:
 *    Before: const { defaultInfobox } = selectionReason; // from Core
 *    After:  const defaultInfobox = generateDefaultInfobox(layer, feature);
 *
 * 4. Store infobox configuration separately from Core layers:
 *    Option A: Map<layerId, Infobox>
 *    Option B: VisualizerLayer[] wrapper around Layer[]
 *
 * 5. Remove infobox from layer creation:
 *    Before: createLayer({ ...props, infobox: {...} })
 *    After:  createLayer({ ...props }) // infobox stored separately
 *
 * 6. Update all imports:
 *    Before: import { Infobox, DefaultInfobox } from "@reearth/core";
 *    After:  import { Infobox, DefaultInfobox } from "./types/infobox";
 *
 * See MIGRATION_INFOBOX_REMOVAL.md for detailed migration guide with examples.
 */
