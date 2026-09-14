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
describe("extractSimpleLayer reference stability — baseline", () => {
  it("returns a NEW reference on every call (documents current broken behavior)", () => {
    const ref1 = extractSimpleLayer(computedLayer);
    const ref2 = extractSimpleLayer(computedLayer);

    // Functionally correct — same value
    expect(ref1).toEqual(ref2);

    // Identity is unstable — this is the bug
    // useMemo sees currentLayer change every render → provider always rebuilt
    expect(ref1).not.toBe(ref2);
  });

  it("simulates 10 re-renders: provider constructs 10× due to unstable reference", () => {
    let constructCount = 0;
    let prev = extractSimpleLayer(computedLayer);

    for (let i = 0; i < 10; i++) {
      const next = extractSimpleLayer(computedLayer);
      if (next !== prev) {
        // useMemo recomputes → new MVTImageryProvider() would be called
        constructCount++;
        prev = next;
      }
    }

    // BASELINE:  constructCount = 10 (every re-render triggers a new provider)
    // AFTER FIX: constructCount = 0  (stable reference, memo actually caches)
    console.log(`Provider constructions in 10 re-renders (baseline): ${constructCount}`);
    expect(constructCount).toBe(10);
  });
});
