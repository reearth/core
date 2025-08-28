import { renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { type Tile, useImageryProviders } from "./Imagery";

test("useImageryProviders", () => {
  const provider = vi.fn(({ url }: { url?: string } = {}): any => ({ hoge: url }));
  const provider2 = vi.fn(({ url }: { url?: string } = {}): any => ({ hoge2: url }));
  const presets = { default: provider, default_label: provider2 };
  const { result, rerender } = renderHook(
    ({ tiles, cesiumIonAccessToken }: { tiles: Tile[]; cesiumIonAccessToken?: string }) =>
      useImageryProviders({
        tiles,
        presets,
        cesiumIonAccessToken,
      }),
    { initialProps: { tiles: [{ id: "1", type: "default" }], cesiumIonAccessToken: undefined } },
  );

  const typedRerender = rerender as (props: {
    tiles: Tile[];
    cesiumIonAccessToken?: string;
  }) => void;

  expect(result.current.providers).toEqual({ "1": ["default", undefined, { hoge: undefined }] });
  expect(result.current.updated).toBe(true);
  expect(provider).toBeCalledTimes(1);
  const prevImageryProvider = result.current.providers["1"][2];

  // re-render with same tiles
  typedRerender({ tiles: [{ id: "1", type: "default" }] });

  expect(result.current.providers).toEqual({ "1": ["default", undefined, { hoge: undefined }] });
  expect(result.current.providers["1"][2]).toBe(prevImageryProvider); // 1's provider should be reused
  expect(provider).toBeCalledTimes(1);

  // update a tile URL
  typedRerender({ tiles: [{ id: "1", type: "default", url: "a" }] });

  expect(result.current.providers).toEqual({ "1": ["default", "a", { hoge: "a" }] });
  expect(result.current.providers["1"][2]).not.toBe(prevImageryProvider);
  expect(result.current.updated).toBe(true);
  expect(provider).toBeCalledTimes(2);
  expect(provider).toBeCalledWith({ url: "a" });
  const prevImageryProvider2 = result.current.providers["1"][2];

  // add a tile with URL
  typedRerender({
    tiles: [
      { id: "2", type: "default" },
      { id: "1", type: "default", url: "a" },
    ],
  });

  expect(result.current.providers).toEqual({
    "2": ["default", undefined, { hoge: undefined }],
    "1": ["default", "a", { hoge: "a" }],
  });
  expect(result.current.updated).toBe(true);
  expect(result.current.providers["1"][2]).toBe(prevImageryProvider2); // 1's provider should be reused
  expect(provider).toBeCalledTimes(3);

  // sort tiles
  typedRerender({
    tiles: [
      { id: "1", type: "default", url: "a" },
      { id: "2", type: "default" },
    ],
  });

  expect(result.current.providers).toEqual({
    "1": ["default", "a", { hoge: "a" }],
    "2": ["default", undefined, { hoge: undefined }],
  });
  expect(result.current.updated).toBe(true);
  expect(result.current.providers["1"][2]).toBe(prevImageryProvider2); // 1's provider should be reused
  expect(provider).toBeCalledTimes(3);

  // delete a tile
  typedRerender({
    tiles: [{ id: "1", type: "default", url: "a" }],
    cesiumIonAccessToken: "a",
  });

  expect(result.current.providers).toEqual({
    "1": ["default", "a", { hoge: "a" }],
  });
  expect(result.current.updated).toBe(true);
  expect(result.current.providers["1"][2]).not.toBe(prevImageryProvider2);
  expect(provider).toBeCalledTimes(4);

  // update a tile type
  typedRerender({
    tiles: [{ id: "1", type: "default_label", url: "u" }],
    cesiumIonAccessToken: "a",
  });

  expect(result.current.providers).toEqual({
    "1": ["default_label", "u", { hoge2: "u" }],
  });
  expect(result.current.updated).toBe(true);
  expect(provider).toBeCalledTimes(4);
  expect(provider2).toBeCalledTimes(1);

  typedRerender({ tiles: [] });
  expect(result.current.providers).toEqual({});
});
