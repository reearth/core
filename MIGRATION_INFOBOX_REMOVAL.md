# Migration Guide: Removal of Infobox/Crust Types from Core

**Version:** 0.1.0-beta.0 (Breaking Change)
**Date:** 2025-11-12
**Issue:** Removal of Visualizer/Crust-related types from Core library

## Overview

Core is now focused solely on map-related functionality. The Infobox feature and other Visualizer/UI-specific types have been removed from Core and should be implemented in the Visualizer package instead.

## Breaking Changes Summary

### 1. Removed Types

The following types have been **completely removed** from `@reearth/core`:

- `Infobox<BP>`
- `InfoboxProperty`
- `InfoboxBlock<P>`
- `PropertyItem<T>`
- `DefaultInfobox`
- `NaiveInfobox`
- `NaiveBlock<P>`

**Removed File:**
- `src/reearthTypes.ts` (entire file deleted)

### 2. Changed Types

#### `LayerCommon` - Removed `infobox` field

**Before:**
```typescript
type LayerCommon = {
  id: string;
  title?: string;
  visible?: boolean;
  infobox?: Infobox;  // ❌ REMOVED
  tags?: Tag[];
  creator?: string;
  compat?: LayerCompat;
  _updateStyle?: number;
};
```

**After:**
```typescript
type LayerCommon = {
  id: string;
  title?: string;
  visible?: boolean;
  // infobox removed
  tags?: Tag[];
  creator?: string;
  compat?: LayerCompat;
  _updateStyle?: number;
};
```

#### `LayerSelectionReason` - Removed `defaultInfobox` field

**Before:**
```typescript
type LayerSelectionReason = {
  reason?: string;
  defaultInfobox?: DefaultInfobox;  // ❌ REMOVED
};
```

**After:**
```typescript
type LayerSelectionReason = {
  reason?: string;
  // defaultInfobox removed
};
```

#### `FeatureSelectionReason` - Removed `defaultInfobox` field

**Before:**
```typescript
type FeatureSelectionReason = {
  reason?: string;
  defaultInfobox?: DefaultInfobox;  // ❌ REMOVED
};
```

**After:**
```typescript
type FeatureSelectionReason = {
  reason?: string;
  // defaultInfobox removed
};
```

#### `LegacyLayer` - Removed `infobox` field

**Before:**
```typescript
type LegacyLayer<P = any, IBP = any> = {
  id: string;
  type?: string;
  pluginId?: string;
  extensionId?: string;
  title?: string;
  property?: P;
  infobox?: Infobox<IBP>;  // ❌ REMOVED
  isVisible?: boolean;
  propertyId?: string;
  tags?: Tag[];
  readonly children?: LegacyLayer[];
  creator?: string;
};
```

**After:**
```typescript
type LegacyLayer<P = any> = {
  id: string;
  type?: string;
  pluginId?: string;
  extensionId?: string;
  title?: string;
  property?: P;
  // infobox removed
  isVisible?: boolean;
  propertyId?: string;
  tags?: Tag[];
  readonly children?: LegacyLayer[];
  creator?: string;
};
```

---

## Migration Paths

### Migration 1: Move Infobox Types to Visualizer

**What to do:** Copy these type definitions to your Visualizer package.

**Create file:** `packages/visualizer/src/types/infobox.ts`

```typescript
// Types to add to your Visualizer package

/**
 * Infobox configuration for a layer
 */
export type Infobox<BP = any> = {
  id?: string;
  property?: InfoboxProperty;
  blocks?: InfoboxBlock<BP>[];
  featureId?: string;
};

/**
 * Infobox UI property configuration
 */
export type InfoboxProperty = {
  position?: "right" | "left";
  size?: "small" | "medium" | "large";
  heightType?: "auto" | "manual";
  outlineColor?: string;
  outlineWidth?: number;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  gap?: number;
  bgcolor?: string;
  typography?: object;
  /**
   * @deprecated Legacy field for Crust compatibility
   * Use "description" or "attributes" for default content display
   */
  defaultContent?: "description" | "attributes";
};

/**
 * Infobox block configuration (plugin-based content)
 */
export type InfoboxBlock<P = any> = {
  id: string;
  name?: string;
  pluginId?: string;      // Crust plugin ID
  extensionId?: string;   // Crust extension ID
  property?: P;
  propertyId?: string;
};

/**
 * Generic property item with UI metadata
 */
export type PropertyItem<T> = {
  id?: string;
  type?: string;
  ui?: string;
  title?: string;
  description?: string;
  choices?: { key: string; label: string }[];
  value?: T;
};

/**
 * Default infobox content generated from feature properties
 */
export type DefaultInfobox = {
  title?: string;
  content:
    | {
        type: "table";
        value: { key: string; value: string }[];
      }
    | { type: "html"; value: string };
};

/**
 * Naive infobox type without IDs (for initial creation)
 */
export type NaiveInfobox = Omit<Infobox, "id" | "blocks"> & {
  blocks?: NaiveBlock[]
};

/**
 * Naive block type without ID
 */
export type NaiveBlock<P = any> = Omit<InfoboxBlock<P>, "id">;
```

### Migration 2: Update Layer Type Extensions

**What to do:** Create a Visualizer-specific layer type that extends Core's layer type.

**Create file:** `packages/visualizer/src/types/layer.ts`

```typescript
import { Layer as CoreLayer } from "@reearth/core";
import { Infobox } from "./infobox";

/**
 * Visualizer layer extends Core layer with UI-specific properties
 */
export type VisualizerLayer = CoreLayer & {
  infobox?: Infobox;
};

/**
 * Convert Core layer to Visualizer layer
 */
export function toVisualizerLayer(
  coreLayer: CoreLayer,
  infobox?: Infobox
): VisualizerLayer {
  return {
    ...coreLayer,
    infobox,
  };
}

/**
 * Extract Core layer from Visualizer layer
 */
export function toCoreLayer(visualizerLayer: VisualizerLayer): CoreLayer {
  const { infobox, ...coreLayer } = visualizerLayer;
  return coreLayer;
}
```

### Migration 3: Update Selection Callbacks

**What to do:** Generate `defaultInfobox` content in Visualizer, not in Core's engine callbacks.

#### Before (in Core consumer code):

```typescript
import { Map } from "@reearth/core";

<Map
  onLayerSelect={(layerId, layer, options) => {
    // options.defaultInfobox was provided by Core ❌
    const infobox = options.defaultInfobox;
    showInfobox(infobox);
  }}
/>
```

#### After (in Visualizer code):

```typescript
import { Map } from "@reearth/core";
import { generateDefaultInfobox } from "./utils/infobox";

<Map
  onLayerSelect={(layerId, layer, options) => {
    // Generate defaultInfobox in Visualizer instead ✅
    const feature = options.feature;
    const infobox = generateDefaultInfobox(layer, feature);
    showInfobox(infobox);
  }}
/>
```

**Create utility:** `packages/visualizer/src/utils/infobox.ts`

```typescript
import { Layer, ComputedFeature } from "@reearth/core";
import { DefaultInfobox } from "../types/infobox";

/**
 * Generate default infobox content from layer and feature data
 */
export function generateDefaultInfobox(
  layer?: Layer,
  feature?: ComputedFeature
): DefaultInfobox | undefined {
  if (!feature?.properties) return undefined;

  // Extract properties as key-value pairs
  const properties = Object.entries(feature.properties).map(([key, value]) => ({
    key,
    value: String(value ?? ""),
  }));

  return {
    title: layer?.title || feature.id,
    content: {
      type: "table",
      value: properties,
    },
  };
}

/**
 * Convert entity description to infobox content
 */
export function entityDescriptionToInfobox(
  description?: string,
  title?: string
): DefaultInfobox | undefined {
  if (!description) return undefined;

  return {
    title,
    content: {
      type: "html",
      value: description,
    },
  };
}
```

### Migration 4: Update Layer Creation Code

**What to do:** Remove `infobox` when creating Core layers.

#### Before:

```typescript
import { createLayer } from "@reearth/core";

const layer = createLayer({
  id: "layer1",
  type: "simple",
  title: "My Layer",
  infobox: {  // ❌ No longer valid
    property: {
      position: "right",
      defaultContent: "attributes",
    },
    blocks: [],
  },
});
```

#### After:

```typescript
import { createLayer } from "@reearth/core";
import { VisualizerLayer } from "./types/layer";

// Create Core layer without infobox
const coreLayer = createLayer({
  id: "layer1",
  type: "simple",
  title: "My Layer",
  // infobox removed
});

// Add infobox in Visualizer layer wrapper
const visualizerLayer: VisualizerLayer = {
  ...coreLayer,
  infobox: {
    property: {
      position: "right",
      defaultContent: "attributes",
    },
    blocks: [],
  },
};
```

### Migration 5: Update State Management

**What to do:** Store infobox configuration separately from Core layer state.

#### Before (single state):

```typescript
const [layers, setLayers] = useState<Layer[]>([]);

// Layers included infobox ❌
```

#### After (separate state):

**Option A: Separate Maps**
```typescript
const [coreLayers, setCoreLayers] = useState<Layer[]>([]);
const [infoboxMap, setInfoboxMap] = useState<Map<string, Infobox>>(new Map());

// Store infobox separately, keyed by layer ID ✅
```

**Option B: Visualizer Layer Wrapper**
```typescript
const [coreLayers, setCoreLayers] = useState<Layer[]>([]);
const [visualizerLayers, setVisualizerLayers] = useState<VisualizerLayer[]>([]);

// Sync Core layers to Visualizer layers
useEffect(() => {
  setVisualizerLayers(coreLayers.map(layer => ({
    ...layer,
    infobox: infoboxMap.get(layer.id),
  })));
}, [coreLayers, infoboxMap]);
```

---

## Impact on Existing Code

### Files That Need Updates

#### In Visualizer Package:

1. **Layer state management** - Remove `infobox` from Core layer objects
2. **Selection handlers** - Generate `defaultInfobox` in Visualizer instead of using Core's
3. **Layer creation/editing** - Separate infobox configuration from Core layer properties
4. **Type imports** - Change from `import { Infobox } from "@reearth/core"` to local types
5. **Legacy layer compatibility** - Update converters that handled `infobox` in layers

#### In Core Package (Done):

1. ✅ Removed `infobox` from `LayerCommon`
2. ✅ Removed `DefaultInfobox` from selection callbacks
3. ✅ Removed Cesium engine infobox generation logic
4. ✅ Deleted `reearthTypes.ts`
5. ✅ Updated exports

---

## Testing Checklist

After migration, verify:

- [ ] Core library builds without errors
- [ ] Core tests pass (infobox-related tests removed)
- [ ] Visualizer package has all necessary type definitions
- [ ] Layer selection still works (without `defaultInfobox` from Core)
- [ ] Infobox display works using Visualizer-generated content
- [ ] Layer creation/editing works with separated infobox state
- [ ] Legacy layer imports still work (if applicable)
- [ ] No runtime errors when clicking features/layers

---

## Rollback Plan

If you need to temporarily rollback:

1. Revert Core to version `0.0.7-beta.0` (before this breaking change)
2. Pin Core dependency in Visualizer: `"@reearth/core": "0.0.7-beta.0"`
3. Complete Visualizer migration at your own pace
4. Upgrade Core when ready

---

## Additional Notes

### Why This Change?

- **Separation of concerns**: Core should only handle map rendering, not UI presentation
- **Reduced bundle size**: Visualizer-specific types no longer bundled in Core
- **Cleaner architecture**: Map engine doesn't generate UI content structures
- **Better extensibility**: Visualizer can define custom infobox types without changing Core

### Plugin/Extension System

The `pluginId` and `extensionId` fields in the removed types were part of the legacy Crust plugin system. If you're still using this system:

1. Keep these fields in your Visualizer's `InfoboxBlock` type
2. Handle plugin resolution in Visualizer, not Core
3. Pass only map-related data to Core's layer properties

### Questions?

If you encounter issues during migration, check:

1. **Type errors**: Make sure you've defined all Infobox types in Visualizer
2. **Runtime errors**: Ensure selection callbacks don't expect `defaultInfobox` from Core
3. **Missing data**: Verify you're generating infobox content in Visualizer instead

---

## Version History

| Version | Change |
|---------|--------|
| 0.1.0-beta.0 | Breaking: Removed Infobox types and related fields |
| 0.0.7-beta.0 | Last version with Infobox types (use for rollback) |
