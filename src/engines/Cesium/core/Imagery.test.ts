import { renderHook } from "@testing-library/react";
import { UrlTemplateImageryProvider } from "cesium";
import { expect, test, vi, beforeEach } from "vitest";

import type { CustomProviderConfig } from "../../../Map/types/customProvider";

import ImageryLayers, { type Tile, useImageryProviders } from "./Imagery";

// Mock Cesium scene and imageryLayerCollection for ImageryLayers component tests
const mockAdd = vi.fn();
const mockRemove = vi.fn();
const mockContains = vi.fn(() => true);
const mockIndexOf = vi.fn(() => 0);
const mockRequestRender = vi.fn();

const mockImageryLayerCollection = {
  add: mockAdd,
  remove: mockRemove,
  contains: mockContains,
  indexOf: mockIndexOf,
};

const mockScene = {
  requestRender: mockRequestRender,
  isDestroyed: () => false,
};

vi.mock("resium", () => ({
  useCesium: () => ({
    imageryLayerCollection: mockImageryLayerCollection,
    scene: mockScene,
  }),
}));

beforeEach(() => {
  mockAdd.mockClear();
  mockRemove.mockClear();
  mockContains.mockClear();
  mockIndexOf.mockClear();
  mockRequestRender.mockClear();
});

test("useImageryProviders", () => {
  const provider = vi.fn(({ url }: { url?: string } = {}): any => ({ hoge: url }));
  const osmProvider = vi.fn((): any => ({ osm: true }));

  const presets = {
    cesium_ion_default: provider,
    open_street_map: osmProvider,
  } as any;

  const { result, rerender } = renderHook(
    ({
      tiles,
      cesiumIonAccessToken,
      customProvider,
    }: {
      tiles: Tile[];
      cesiumIonAccessToken?: string;
      customProvider?: CustomProviderConfig;
    }) =>
      useImageryProviders({
        tiles,
        presets,
        cesiumIonAccessToken,
        customProvider,
      }),
    {
      initialProps: {
        tiles: [{ id: "1", type: "cesium_ion_default" }],
        cesiumIonAccessToken: undefined,
        customProvider: undefined,
      },
    },
  );

  const typedRerender = rerender as (props: {
    tiles: Tile[];
    cesiumIonAccessToken?: string;
    customProvider?: CustomProviderConfig;
  }) => void;

  expect(result.current.providers).toEqual({
    "1": ["cesium_ion_default", undefined, undefined, { hoge: undefined }],
  });
  expect(result.current.updated).toBe(true);
  expect(provider).toBeCalledTimes(1);
  const prevImageryProvider = result.current.providers["1"][3];

  // re-render with same tiles
  typedRerender({ tiles: [{ id: "1", type: "cesium_ion_default" }] });

  expect(result.current.providers).toEqual({
    "1": ["cesium_ion_default", undefined, undefined, { hoge: undefined }],
  });
  expect(result.current.providers["1"][3]).toBe(prevImageryProvider); // 1's provider should be reused
  expect(provider).toBeCalledTimes(1);

  // update a tile URL
  typedRerender({ tiles: [{ id: "1", type: "cesium_ion_default", url: "a" }] });

  expect(result.current.providers).toEqual({
    "1": ["cesium_ion_default", "a", undefined, { hoge: "a" }],
  });
  expect(result.current.providers["1"][3]).not.toBe(prevImageryProvider);
  expect(result.current.updated).toBe(true);
  expect(provider).toBeCalledTimes(2);
  expect(provider).toBeCalledWith({ url: "a" });
  const prevImageryProvider2 = result.current.providers["1"][3];

  // add a tile with URL
  typedRerender({
    tiles: [
      { id: "2", type: "cesium_ion_default" },
      { id: "1", type: "cesium_ion_default", url: "a" },
    ],
  });

  expect(result.current.providers).toEqual({
    "2": ["cesium_ion_default", undefined, undefined, { hoge: undefined }],
    "1": ["cesium_ion_default", "a", undefined, { hoge: "a" }],
  });
  expect(result.current.updated).toBe(true);
  expect(result.current.providers["1"][3]).toBe(prevImageryProvider2); // 1's provider should be reused
  expect(provider).toBeCalledTimes(3);

  // sort tiles
  typedRerender({
    tiles: [
      { id: "1", type: "cesium_ion_default", url: "a" },
      { id: "2", type: "cesium_ion_default" },
    ],
  });

  expect(result.current.providers).toEqual({
    "1": ["cesium_ion_default", "a", undefined, { hoge: "a" }],
    "2": ["cesium_ion_default", undefined, undefined, { hoge: undefined }],
  });
  expect(result.current.updated).toBe(true);
  expect(result.current.providers["1"][3]).toBe(prevImageryProvider2); // 1's provider should be reused
  expect(provider).toBeCalledTimes(3);

  // Ion token update triggers provider recreation for cesium_ion_* types
  typedRerender({
    tiles: [{ id: "1", type: "cesium_ion_default", url: "a" }],
    cesiumIonAccessToken: "a",
  });

  expect(result.current.providers).toEqual({
    "1": ["cesium_ion_default", "a", undefined, { hoge: "a" }],
  });
  expect(result.current.updated).toBe(true);
  expect(result.current.providers["1"][3]).not.toBe(prevImageryProvider2);
  expect(provider).toBeCalledTimes(4);

  // unknown type without customProvider: falls back directly to open_street_map
  typedRerender({
    tiles: [{ id: "1", type: "unexpected_type", url: "u" }],
  });

  expect(result.current.providers["1"][0]).toBe("unexpected_type");
  expect(result.current.providers["1"][3]).toEqual({ osm: true });
  expect(result.current.updated).toBe(true);
  expect(osmProvider).toBeCalledTimes(1);

  // unknown type with a matching customProvider entry: uses UrlTemplateImageryProvider
  typedRerender({
    tiles: [{ id: "1", type: "my_custom_satellite", url: "u" }],
    customProvider: {
      imagery: {
        providers: [
          {
            id: "my_custom_satellite",
            url: "https://example.com/{z}/{x}/{y}.png",
            credit: "© Example",
          },
        ],
      },
    },
  });

  const dynamicProvider = result.current.providers["1"][3];
  expect(dynamicProvider).toBeDefined();
  expect(dynamicProvider).toBeInstanceOf(UrlTemplateImageryProvider);
  expect(osmProvider).toBeCalledTimes(1); // osm not called again

  typedRerender({ tiles: [] });
  expect(result.current.providers).toEqual({});
});

test("ImageryLayers should not re-render when tiles array reference changes but content is the same", async () => {
  const tiles: Tile[] = [{ id: "1", type: "open_street_map", opacity: 0.8 }];

  const { rerender } = renderHook(
    ({ tiles }: { tiles: Tile[] }) => {
      return ImageryLayers({
        tiles,
        cesiumIonAccessToken: undefined,
        customProvider: undefined,
        onTilesChange: undefined,
      });
    },
    {
      initialProps: { tiles },
    },
  );

  // Wait for initial render to complete
  await new Promise(resolve => setTimeout(resolve, 0));

  // Clear mock calls from initial render
  mockAdd.mockClear();
  mockRemove.mockClear();

  // Re-render with a NEW tiles array reference but SAME content
  const newTilesArraySameContent: Tile[] = [{ id: "1", type: "open_street_map", opacity: 0.8 }];

  rerender({ tiles: newTilesArraySameContent });

  // Wait for any effects to run
  await new Promise(resolve => setTimeout(resolve, 0));

  // Effect should NOT have run again - no layers should be removed or added
  expect(mockRemove).not.toHaveBeenCalled();
  expect(mockAdd).not.toHaveBeenCalled();

  // Clear mocks
  mockAdd.mockClear();
  mockRemove.mockClear();

  // Re-render with DIFFERENT content (changed opacity)
  const differentTiles: Tile[] = [
    { id: "1", type: "open_street_map", opacity: 0.5 }, // opacity changed
  ];

  rerender({ tiles: differentTiles });

  // Wait for effects to run
  await new Promise(resolve => setTimeout(resolve, 0));

  // Effect SHOULD run - old layers removed and new ones added
  expect(mockRemove).toHaveBeenCalled();
  expect(mockAdd).toHaveBeenCalled();
});
