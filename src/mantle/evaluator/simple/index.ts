import { cloneDeep, pick } from "lodash-es";

import type { EvalContext, EvalResult } from "..";
import {
  appearanceKeys,
  AppearanceTypes,
  ComputedFeature,
  Feature,
  LayerAppearanceTypes,
  LayerSimple,
  ExpressionContainer,
  TimeInterval,
} from "../../types";

import { ConditionalExpression } from "./conditionalExpression";
import { clearExpressionCaches, Expression } from "./expression";
import { evalTimeInterval } from "./interval";
import { recursiveJSONParse } from "./utils";

export async function evalSimpleLayer(
  layer: LayerSimple,
  ctx: EvalContext,
): Promise<EvalResult | undefined> {
  const features = layer.data ? await ctx.getAllFeatures(layer.data) : undefined;
  const appearances: Partial<LayerAppearanceTypes> = pick(layer, appearanceKeys);
  const timeIntervals = evalTimeInterval(features, layer.data?.time);
  // Compute once per layer render — same appearances apply to every feature.
  const layerHasExpressions = hasAnyExpression(appearances);
  return {
    layer: evalLayerAppearances(appearances, layer),
    features: features?.map((f, i) =>
      evalSimpleLayerFeature(layer, f, timeIntervals?.[i], layerHasExpressions),
    ),
  };
}

export const evalSimpleLayerFeature = (
  layer: LayerSimple,
  feature: Feature,
  interval?: TimeInterval,
  layerHasExpressions = true,
): ComputedFeature => {
  const appearances: Partial<LayerAppearanceTypes> = pick(layer, appearanceKeys);
  const nextFeature = evalJsonProperties(layer, feature);
  // Clone and parse once per feature, shared across all expression evaluations.
  // Skip entirely when the layer has no expressions — preserves the static-layer fast path.
  const parsedFeature = layerHasExpressions
    ? recursiveJSONParse(cloneDeep(nextFeature))
    : undefined;
  return {
    ...nextFeature,
    ...evalLayerAppearances(appearances, layer, nextFeature, parsedFeature),
    type: "computedFeature",
    interval,
  };
};

export function evalLayerAppearances(
  appearance: Partial<LayerAppearanceTypes>,
  layer: LayerSimple,
  feature?: Feature,
  parsedFeature?: Feature,
): Partial<AppearanceTypes> {
  if (!feature) {
    if (!layer.id) {
      throw new Error("layer id is required");
    }
    feature = {
      type: "feature",
      id: layer.id,
      properties: layer.properties || {},
    };
  }

  return Object.fromEntries(
    Object.entries(appearance)
      .map(([k, v]) => (v ? [k, recursiveValEval(v, layer, feature, parsedFeature)] : undefined))
      .filter((v): v is [keyof LayerAppearanceTypes, LayerAppearanceTypes] => !!v),
  );
}

function recursiveValEval(
  obj: any,
  layer: LayerSimple,
  feature?: Feature,
  parsedFeature?: Feature,
): any {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      // if v is an object itself and not a null, recurse deeper
      if (hasNonExpressionObject(v)) {
        return [k, recursiveValEval(v, layer, feature, parsedFeature)];
      }
      // if v is not an object, apply the evalExpression function
      return [k, evalExpression(v, layer, feature, parsedFeature)];
    }),
  );
}

export function clearAllExpressionCaches(
  layer: LayerSimple | undefined,
  feature: Feature | undefined,
) {
  const appearances: Partial<LayerAppearanceTypes> = pick(layer, appearanceKeys);
  Object.entries(appearances).forEach(([, v]) => {
    recursiveClear(v, layer, feature);
  });
}

function recursiveClear(obj: any, layer: LayerSimple | undefined, feature: Feature | undefined) {
  Object.entries(obj).forEach(([, v]) => {
    // if v is an object itself and not a null, recurse deeper
    if (hasNonExpressionObject(v)) {
      recursiveClear(v, layer, feature);
    } else if (hasExpression(v)) {
      // if v is not an object, apply the clearExpressionCaches function
      const styleExpression = v.expression;
      if (typeof styleExpression === "object" && styleExpression.conditions) {
        styleExpression.conditions.forEach(([expression1, expression2]) => {
          clearExpressionCaches(expression1, feature, layer?.defines);
          clearExpressionCaches(expression2, feature, layer?.defines);
        });
      } else if (typeof styleExpression === "boolean" || typeof styleExpression === "number") {
        clearExpressionCaches(String(styleExpression), feature, layer?.defines);
      } else if (typeof styleExpression === "string") {
        clearExpressionCaches(styleExpression, feature, layer?.defines);
      }
    }
  });
}

function hasExpression(e: any): e is ExpressionContainer {
  return typeof e === "object" && e && "expression" in e;
}

function hasNonExpressionObject(v: any): boolean {
  return typeof v === "object" && v && !("expression" in v) && !Array.isArray(v);
}

function hasAnyExpression(obj: any): boolean {
  if (typeof obj !== "object" || !obj || Array.isArray(obj)) return false;
  if ("expression" in obj) return true;
  return Object.values(obj).some(v => hasAnyExpression(v));
}

export function evalExpression(
  expressionContainer: any,
  layer?: LayerSimple,
  feature?: Feature,
  parsedFeature?: Feature,
): unknown | undefined {
  try {
    if (hasExpression(expressionContainer)) {
      const styleExpression = expressionContainer.expression;
      const resolved = parsedFeature ?? recursiveJSONParse(cloneDeep(feature));
      if (typeof styleExpression === "undefined") {
        return undefined;
      } else if (typeof styleExpression === "object" && styleExpression.conditions) {
        return new ConditionalExpression(styleExpression, resolved, layer?.defines).evaluate();
      } else if (typeof styleExpression === "boolean" || typeof styleExpression === "number") {
        return new Expression(String(styleExpression), resolved, layer?.defines).evaluate();
      } else if (typeof styleExpression === "string") {
        return new Expression(styleExpression, resolved, layer?.defines).evaluate();
      }
      return styleExpression;
    }
    return expressionContainer;
  } catch (e) {
    console.error(e);
    return;
  }
}

function evalJsonProperties(layer: LayerSimple, feature: Feature): Feature {
  const keys = layer.data?.jsonProperties;
  if (!feature.properties || !keys || !keys.length) {
    return feature;
  }

  const next = {
    ...feature,
    ...(feature?.properties ? { properties: { ...feature.properties } } : {}),
  };
  keys.forEach(k => {
    next.properties[k] = (() => {
      const p = next.properties[k];
      try {
        return JSON.parse(p);
      } catch {
        return p;
      }
    })();
  });

  return next;
}
