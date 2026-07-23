import { describe, expect, test } from "vitest";

import { computeHasCesiumIonAsset } from "./cesiumIonDetection";

const makeSimple = (data?: object) => ({
  id: "layer1",
  type: "simple" as const,
  ...(data ? { data } : {}),
});

const makeGroup = (children: object[]) => ({
  id: "group1",
  type: "group" as const,
  children,
});

describe("computeHasCesiumIonAsset", () => {
  describe("tiles", () => {
    test("returns false when no tiles", () => {
      expect(computeHasCesiumIonAsset({ tiles: [] })).toBe(false);
    });

    test("returns true for cesium_ion tile type with valid assetId", () => {
      expect(
        computeHasCesiumIonAsset(
          { tiles: [{ id: "", type: "cesium_ion", cesiumIonAssetId: 12345 }] },
          undefined,
          "my-token",
        ),
      ).toBe(true);
    });

    test("returns true for cesium_ion_default tile type when token present", () => {
      expect(
        computeHasCesiumIonAsset(
          { tiles: [{ id: "", type: "cesium_ion_default" }] },
          undefined,
          "my-token",
        ),
      ).toBe(true);
    });

    test("returns true for legacy tile types when token present", () => {
      for (const type of ["default", "default_road", "default_label", "black_marble"]) {
        expect(computeHasCesiumIonAsset({ tiles: [{ id: "", type }] }, undefined, "my-token")).toBe(
          true,
        );
      }
    });

    test("returns false for non-ion tile type", () => {
      expect(
        computeHasCesiumIonAsset({
          tiles: [{ id: "", type: "open_street_map" }],
        }),
      ).toBe(false);
    });
  });

  describe("terrain", () => {
    test("returns true for cesium terrain type when enabled", () => {
      expect(
        computeHasCesiumIonAsset({
          terrain: { enabled: true, type: "cesium" },
        }),
      ).toBe(true);
    });

    test("returns true for cesiumion terrain type with ionAsset", () => {
      expect(
        computeHasCesiumIonAsset({
          terrain: { enabled: true, type: "cesiumion" },
          assets: { cesium: { terrain: { ionAsset: "1" } } },
        } as any),
      ).toBe(true);
    });

    test("returns false for cesiumion terrain type without ionAsset or ionUrl", () => {
      expect(
        computeHasCesiumIonAsset({
          terrain: { enabled: true, type: "cesiumion" },
        }),
      ).toBe(false);
    });

    test("returns false for cesium terrain when disabled", () => {
      expect(
        computeHasCesiumIonAsset({
          terrain: { enabled: false, type: "cesium" },
        }),
      ).toBe(false);
    });

    test("returns true for ion terrain URL", () => {
      expect(
        computeHasCesiumIonAsset({
          terrain: { enabled: true, type: "url" },
          assets: {
            cesium: {
              terrain: {
                ionUrl: "https://assets.ion.cesium.com/1/tileset.json",
              },
            },
          },
        } as any),
      ).toBe(true);
    });

    test("returns false for non-ion terrain URL", () => {
      expect(
        computeHasCesiumIonAsset({
          terrain: { enabled: true, type: "url" },
          assets: {
            cesium: { terrain: { ionUrl: "https://example.com/terrain" } },
          },
        } as any),
      ).toBe(false);
    });
  });

  describe("layers", () => {
    test("returns true for osm-buildings layer", () => {
      expect(
        computeHasCesiumIonAsset(undefined, [makeSimple({ type: "osm-buildings" })] as any),
      ).toBe(true);
    });

    test("returns true for google-photorealistic with cesium-ion provider", () => {
      expect(
        computeHasCesiumIonAsset(undefined, [
          makeSimple({ type: "google-photorealistic", provider: "cesium-ion" }),
        ] as any),
      ).toBe(true);
    });

    test("returns false for google-photorealistic with reearth provider", () => {
      expect(
        computeHasCesiumIonAsset(undefined, [
          makeSimple({ type: "google-photorealistic", provider: "reearth" }),
        ] as any),
      ).toBe(false);
    });

    test("returns false for google-photorealistic with no provider (google API path)", () => {
      expect(
        computeHasCesiumIonAsset(undefined, [makeSimple({ type: "google-photorealistic" })] as any),
      ).toBe(false);
    });

    test("returns true for layer with ion URL", () => {
      expect(
        computeHasCesiumIonAsset(undefined, [
          makeSimple({
            type: "3dtiles",
            url: "https://assets.ion.cesium.com/123/tileset.json",
          }),
        ] as any),
      ).toBe(true);
    });

    test("returns true for any layer type with ion URL", () => {
      expect(
        computeHasCesiumIonAsset(undefined, [
          makeSimple({
            type: "geojson",
            url: "https://assets.ion.cesium.com/456/data.json",
          }),
        ] as any),
      ).toBe(true);
    });

    test("returns false for layer with non-ion URL", () => {
      expect(
        computeHasCesiumIonAsset(undefined, [
          makeSimple({
            type: "3dtiles",
            url: "https://example.com/tileset.json",
          }),
        ] as any),
      ).toBe(false);
    });

    test("returns false for layer with no data", () => {
      expect(computeHasCesiumIonAsset(undefined, [makeSimple()] as any)).toBe(false);
    });
  });

  describe("layer groups (recursion)", () => {
    test("returns true when nested layer uses ion", () => {
      const group = makeGroup([makeSimple({ type: "osm-buildings" })]);
      expect(computeHasCesiumIonAsset(undefined, [group] as any)).toBe(true);
    });

    test("returns false when nested layer does not use ion", () => {
      const group = makeGroup([
        makeSimple({ type: "geojson", url: "https://example.com/data.json" }),
      ]);
      expect(computeHasCesiumIonAsset(undefined, [group] as any)).toBe(false);
    });

    test("returns true when deeply nested layer uses ion", () => {
      const inner = makeGroup([makeSimple({ type: "osm-buildings" })]);
      const outer = makeGroup([inner]);
      expect(computeHasCesiumIonAsset(undefined, [outer] as any)).toBe(true);
    });
  });

  describe("combined", () => {
    test("returns false when nothing uses ion", () => {
      expect(
        computeHasCesiumIonAsset(
          {
            tiles: [{ id: "", type: "open_street_map" }],
            terrain: { enabled: false, type: "cesium" },
          },
          [
            makeSimple({
              type: "geojson",
              url: "https://example.com/data.json",
            }),
          ] as any,
        ),
      ).toBe(false);
    });

    test("returns true when only tile uses ion", () => {
      expect(
        computeHasCesiumIonAsset(
          { tiles: [{ id: "", type: "default" }] },
          [makeSimple({ type: "geojson" })] as any,
          "my-token",
        ),
      ).toBe(true);
    });

    test("returns true when only terrain uses ion", () => {
      expect(
        computeHasCesiumIonAsset({ terrain: { enabled: true, type: "cesium" } }, [
          makeSimple({ type: "geojson" }),
        ] as any),
      ).toBe(true);
    });

    test("returns undefined-safe (no property, no layers)", () => {
      expect(computeHasCesiumIonAsset()).toBe(false);
      expect(computeHasCesiumIonAsset(undefined, undefined)).toBe(false);
      expect(computeHasCesiumIonAsset(undefined, [])).toBe(false);
    });
  });

  describe("token and assetId gating", () => {
    test("returns false for cesium_ion tile with no cesiumIonAssetId", () => {
      expect(
        computeHasCesiumIonAsset(
          { tiles: [{ id: "", type: "cesium_ion" }] },
          undefined,
          "my-token",
        ),
      ).toBe(false);
    });

    test("returns false for cesium_ion tile with assetId of 0", () => {
      expect(
        computeHasCesiumIonAsset(
          { tiles: [{ id: "", type: "cesium_ion", cesiumIonAssetId: 0 }] },
          undefined,
          "my-token",
        ),
      ).toBe(false);
    });

    test("returns false for cesium_ion_default when no token", () => {
      expect(
        computeHasCesiumIonAsset({
          tiles: [{ id: "", type: "cesium_ion_default" }],
        }),
      ).toBe(false);
    });

    test("returns false for legacy tile types when no token", () => {
      for (const type of ["default", "default_road", "default_label", "black_marble"]) {
        expect(computeHasCesiumIonAsset({ tiles: [{ id: "", type }] })).toBe(false);
      }
    });

    test("returns true for cesium_ion with valid assetId (token gate is at engine level)", () => {
      expect(
        computeHasCesiumIonAsset({
          tiles: [{ id: "", type: "cesium_ion", cesiumIonAssetId: 2275207 }],
        }),
      ).toBe(true);
    });
  });
});
