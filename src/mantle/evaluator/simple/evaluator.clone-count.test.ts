import { describe, test } from "vitest";

// ---------------------------------------------------------------------------
// Analytical clone count — derived from call graph, no instrumentation needed.
//
// evalExpression() calls cloneDeep(feature) once per property that has an
// `expression` key. Call chain per feature:
//   evalSimpleLayerFeature → evalLayerAppearances → recursiveValEval
//     → evalExpression (×exprCount) → cloneDeep(feature)
//
// evalSimpleLayer also calls evalLayerAppearances once at the layer level
// (index.ts:28) before iterating features, so the total is:
//
//   Total clones = (features + 1) × exprCount  (before P1 fix)
//   Total clones = features + 1                (after P1 fix — hoist clone to feature level)
// ---------------------------------------------------------------------------
describe("cloneDeep call count — analytical proof of per-expression cloning", () => {
  test("records expected clone counts for baseline documentation", () => {
    const cases = [
      { label: "1k  × 5 ", features: 1_000, exprs: 5 },
      { label: "10k × 5 ", features: 10_000, exprs: 5 },
      { label: "10k × 10", features: 10_000, exprs: 10 },
      { label: "10k × 15", features: 10_000, exprs: 15 },
      { label: "35k × 10", features: 35_000, exprs: 10 },
    ];
    for (const c of cases) {
      const clonesBefore = (c.features + 1) * c.exprs;
      const clonesAfter = c.features + 1;
      console.log(
        `${c.label}: cloneDeep calls before P1 = ${clonesBefore.toLocaleString()},` +
          ` after P1 = ${clonesAfter.toLocaleString()}` +
          ` (${Math.round(clonesBefore / clonesAfter)}× reduction)`,
      );
    }
  });
});
