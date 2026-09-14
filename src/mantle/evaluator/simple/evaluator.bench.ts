import { bench, describe, test } from "vitest";

import type { Feature, LayerSimple } from "../../types";

import { evalSimpleLayer } from ".";

function makeFeature(i: number): Feature {
  return {
    type: "feature",
    id: `f${i}`,
    properties: {
      name: `feature-${i}`,
      category: i % 5 === 0 ? "A" : "B",
      value: i * 1.5,
      rank: i % 100,
      active: i % 2 === 0,
      region: `region-${i % 10}`,
      score: Math.sin(i),
      label: `label-${i}`,
      count: i,
      ratio: i / 1000,
    },
  };
}

function makeLayer(exprCount: number): LayerSimple {
  const marker: Record<string, unknown> = {};
  const allProps: [string, string][] = [
    ["pointColor", '${category} === "A" ? "#FF0000" : "#0000FF"'],
    ["pointSize", "${rank}"],
    ["pointOutlineColor", '"#FFFFFF"'],
    ["pointOutlineWidth", "1"],
    ["label", "${name}"],
    ["labelColor", '"#333333"'],
    ["labelBackground", "true"],
    ["height", "${value}"],
    ["heightReference", '"relative"'],
    ["extrude", "${active}"],
    ["style", '"circle"'],
    ["sizeInMeters", "false"],
    ["shadows", '"disabled"'],
    ["image", '"default"'],
    ["imageSize", "1"],
  ];
  allProps.slice(0, exprCount).forEach(([k, expr]) => {
    marker[k] = { expression: expr };
  });
  return {
    id: "bench-layer",
    type: "simple",
    // REQUIRED: evalSimpleLayer gates on `layer.data` before calling getAllFeatures.
    // Without this, features is always undefined and nothing gets measured.
    data: { type: "geojson" },
    marker,
    properties: {},
  };
}

const f1k = Array.from({ length: 1_000 }, (_, i) => makeFeature(i));
const f10k = Array.from({ length: 10_000 }, (_, i) => makeFeature(i));
const f35k = Array.from({ length: 35_000 }, (_, i) => makeFeature(i));
const e5 = makeLayer(5);
const e10 = makeLayer(10);
const e15 = makeLayer(15);

const makeCtx = (features: Feature[]) => ({
  getAllFeatures: async (_d: unknown) => features,
  getFeatures: async (_d: unknown) => undefined as Feature[] | undefined,
});

// ---------------------------------------------------------------------------
// Throughput benchmarks
// Run with: pnpm bench
// ---------------------------------------------------------------------------
describe("evalSimpleLayer — baseline throughput", () => {
  bench("1k  features × 5  expr", async () => { await evalSimpleLayer(e5, makeCtx(f1k)); });
  bench("10k features × 5  expr", async () => { await evalSimpleLayer(e5, makeCtx(f10k)); });
  bench("10k features × 10 expr", async () => { await evalSimpleLayer(e10, makeCtx(f10k)); });
  bench("10k features × 15 expr", async () => { await evalSimpleLayer(e15, makeCtx(f10k)); });
  bench("35k features × 10 expr", async () => { await evalSimpleLayer(e10, makeCtx(f35k)); });
});

// ---------------------------------------------------------------------------
// Analytical clone count — derived from call graph, no instrumentation needed.
//
// evalExpression() calls cloneDeep(feature) once per property that has an
// `expression` key. Call chain per feature:
//   evalSimpleLayerFeature → evalLayerAppearances → recursiveValEval
//     → evalExpression (×exprCount) → cloneDeep(feature)
//
// Total clones = features × exprCount  (before P1 fix)
// Total clones = features              (after P1 fix — hoist clone to feature level)
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
      const clonesBefore = c.features * c.exprs;
      const clonesAfter = c.features;
      console.log(
        `${c.label}: cloneDeep calls before P1 = ${clonesBefore.toLocaleString()},` +
          ` after P1 = ${clonesAfter.toLocaleString()}` +
          ` (${Math.round(clonesBefore / clonesAfter)}× reduction)`,
      );
    }
  });
});
