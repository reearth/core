import { describe, expect, it } from "vitest";

import type { ComputedLayer } from "../../../..";
import { extractSimpleLayer } from "../utils";

// ComputedLayer wraps a LayerSimple as `.layer`. extractSimpleLayer checks for
// `"layer" in layer` and unwraps it before calling toPlainObject (= cloneDeep).
const computedLayer = {
  id: "layer-1",
  type: "simple",
  layer: {
    id: "layer-1",
    type: "simple",
    marker: { pointColor: "#FF0000", pointSize: 8 },
    properties: { name: "test" },
  },
} as unknown as ComputedLayer;

// ---------------------------------------------------------------------------
// Baseline: extractSimpleLayer returns a NEW object reference on every call.
//
// Root cause: toPlainObject = cloneDeep (utils.tsx:249-251).
// Consequence: useMemo([..., currentLayer]) in mvt.ts always sees a changed dep
// and reconstructs MVTImageryProvider on every render, even when nothing changed.
//
// After P2a fix: extractSimpleLayer should return a stable reference when the
// input layer hasn't changed, so useMemo can cache the provider.
// ---------------------------------------------------------------------------
describe("extractSimpleLayer reference stability — after P2 fix", () => {
  it("returns the SAME reference on every call (stable after P2 fix)", () => {
    const ref1 = extractSimpleLayer(computedLayer);
    const ref2 = extractSimpleLayer(computedLayer);

    // Same value
    expect(ref1).toEqual(ref2);

    // Same reference — extractSimpleLayer no longer clones, so identity is stable
    expect(ref1).toBe(ref2);
  });
});
