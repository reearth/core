import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";

import { useGet, wrapRef, useOverriddenProperty } from "./utils";

test("useGet", () => {
  const obj = { a: 1 };
  const { result } = renderHook(() => useGet(obj));
  expect(result.current()).toBe(obj);
  expect(result.current().a).toBe(1);

  obj.a = 2;
  expect(result.current()).toBe(obj);
  expect(result.current().a).toBe(2);

  const { result: result2, rerender: rerender2 } = renderHook(
    props => {
      return useGet(props);
    },
    {
      initialProps: { b: 1 },
    },
  );
  expect(result2.current()).toEqual({ b: 1 });
  rerender2({ b: 2 });
  expect(result2.current()).toEqual({ b: 2 });
});

test("wrapRef", () => {
  const ref: {
    current: {
      a: (a: number, b: number) => number;
      b: string;
      c: (a: number, b: number) => number;
    } | null;
  } = {
    current: null,
  };

  const res = wrapRef(ref, { a: 1, c: 1 });
  expect(res).toEqual({
    a: expect.any(Function),
    b: undefined,
    c: expect.any(Function),
  });
  expect(res.a(1, 2)).toBeUndefined();
  expect((res as any).b).toBeUndefined();

  ref.current = {
    a: (a: number, b: number) => a + b,
    b: "foobar",
    c: (a: number, b: number) => a - b,
  };
  expect(res.a(1, 2)).toBe(3);
  expect((res as any).b).toBeUndefined();
  expect(res.c(1, 2)).toBe(-1);

  ref.current = null;
  expect(res.a(1, 2)).toBeUndefined();
  expect((res as any).b).toBeUndefined();
  expect(res.c(1, 2)).toBeUndefined();
});

// test for useOverriddenProperty
test("overriddenProperty", () => {
  const { result } = renderHook(() => useOverriddenProperty({ a: 1, b: 2, c: { c1: 3 } }));
  const [mergedProperty, overrideProperty] = result.current;
  expect(mergedProperty).toEqual({ a: 1, b: 2, c: { c1: 3 } });

  act(() => {
    overrideProperty("plugin1", { a: 2 } as any);
  });
  expect(result.current[0]).toEqual({ a: 2, b: 2, c: { c1: 3 } });

  act(() => {
    overrideProperty("plugin2", { b: 3 } as any);
  });
  expect(result.current[0]).toEqual({ a: 2, b: 3, c: { c1: 3 } });

  act(() => {
    overrideProperty("plugin3", { c: { c2: 1 } } as any);
  });
  expect(result.current[0]).toEqual({ a: 2, b: 3, c: { c1: 3, c2: 1 } });

  act(() => {
    overrideProperty("plugin1", undefined as any);
  });
  expect(result.current[0]).toEqual({ a: 1, b: 3, c: { c1: 3, c2: 1 } });

  act(() => {
    overrideProperty("plugin2", undefined as any);
  });
  expect(result.current[0]).toEqual({ a: 1, b: 2, c: { c1: 3, c2: 1 } });
});
