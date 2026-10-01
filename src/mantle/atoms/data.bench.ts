import { bench, describe } from "vitest";

import type { Feature } from "../types";

// ---------------------------------------------------------------------------
// P3-1: Set vs Array.includes for feature deletion
// The deleteAll atom filters out deleted feature IDs from the cached array.
// Before P3-1: f.filter(g => !idsArray.includes(g.id))  — O(n×m)
// After  P3-1: f.filter(g => !deleteSet.has(g.id))       — O(n)
// ---------------------------------------------------------------------------

function makeFeature(i: number): Feature {
  return {
    type: "feature",
    id: `f${i}`,
    properties: {},
  };
}

const features10k = Array.from({ length: 10_000 }, (_, i) => makeFeature(i));
// Delete IDs scattered across the array (worst case for includes)
const deleteIds100 = Array.from({ length: 100 }, (_, i) => `f${i * 100}`);
const deleteIds1k = Array.from({ length: 1_000 }, (_, i) => `f${i * 10}`);

describe("feature deletion filter — Array.includes vs Set.has (P3-1)", () => {
  bench("delete 100 from 10k — Array.includes (baseline)", () => {
    features10k.filter(g => !deleteIds100.includes(g.id));
  });

  bench("delete 100 from 10k — Set.has (after P3-1)", () => {
    const s = new Set(deleteIds100);
    features10k.filter(g => !s.has(g.id));
  });

  bench("delete 1k from 10k — Array.includes (baseline)", () => {
    features10k.filter(g => !deleteIds1k.includes(g.id));
  });

  bench("delete 1k from 10k — Set.has (after P3-1)", () => {
    const s = new Set(deleteIds1k);
    features10k.filter(g => !s.has(g.id));
  });
});
