import jsep from "jsep";
import { expect, test, describe, beforeEach } from "vitest";

import { Feature } from "../../../types";

import {
  replaceDefines,
  removeBackslashes,
  Expression,
  EXPRESSION_CACHES,
  clearExpressionCaches,
  REPLACED_VARIABLES_CACHE,
} from "./expression";
import { createRuntimeAst } from "./runtime";

describe("replaceDefines", () => {
  test("should replace defined placeholders with the corresponding values in the expression string", () => {
    const result = replaceDefines("${key}", { key: "value" });
    expect(result).toBe("(value)");
  });

  test("should handle multiple defined placeholders in the expression string", () => {
    const result = replaceDefines("${key1} + ${key2}", {
      key1: "value1",
      key2: "value2",
    });
    expect(result).toBe("(value1) + (value2)");
  });

  test("should handle Japanese text with multiple variables", () => {
    const result = replaceDefines("${住所} (${人数}人)", {
      住所: "東京都渋谷区",
      人数: "5",
    });
    expect(result).toBe("(東京都渋谷区) ((5)人)");
  });
});

describe("removeBackslashes", () => {
  test("should remove all backslashes from the expression string", () => {
    const result = removeBackslashes("\\");
    expect(result).toBe("@#%");
  });

  test("should handle multiple backslashes in the expression string", () => {
    const result = removeBackslashes("\\\\");
    expect(result).toBe("@#%@#%");
  });
});

describe("Expression evaluation", () => {
  test("should evaluate Japanese expression with feature properties as string literal", () => {
    const expressionString = '"${住所} (${人数}人)"';
    const feature = {
      properties: {
        住所: "緑町",
        人数: 2,
      },
    } as Feature;

    const expression = new Expression(expressionString, feature);
    const result = expression.evaluate();

    expect(result).toBe("緑町 (2人)");
  });

  test("should evaluate Japanese expression with two spaces - user observation", () => {
    const expressionString = '"${住所}  (${人数}人)"';
    const feature = {
      properties: {
        住所: "緑町",
        人数: 2,
      },
    } as Feature;

    const expression = new Expression(expressionString, feature);
    const result = expression.evaluate();

    expect(result).toBe("緑町  (2人)");
  });

  test("should evaluate expression with multiple variables", () => {
    const expressionString = '"${name}: ${住所} (${人数}人) - ${status}"';
    const feature = {
      properties: {
        name: "太郎",
        住所: "緑町",
        人数: 2,
        status: "完了",
      },
    } as Feature;

    const expression = new Expression(expressionString, feature);
    const result = expression.evaluate();

    expect(result).toBe("太郎: 緑町 (2人) - 完了");
  });

  test("should evaluate Japanese expression without quotes - shows the issue", () => {
    const expressionString = "${住所} (${人数}人)";
    const feature = {
      properties: {
        住所: "緑町",
        人数: 2,
      },
    } as Feature;

    expect(() => {
      const expression = new Expression(expressionString, feature);
      expression.evaluate();
    }).toThrow('Unexpected function call "czm_住所"');
  });
});

describe("expression caches", () => {
  beforeEach(() => {
    EXPRESSION_CACHES.clear();
  });

  test("should remove caches", () => {
    const originalExpression = "${HEIGHT} > 2 ? color('red') : color('blue')";
    const replacedExpression = "czm_HEIGHT > 2 ? color('red') : color('blue')";
    const feature = { properties: { HEIGHT: 1 } } as Feature;
    const expression = new Expression(originalExpression, feature);
    expect(REPLACED_VARIABLES_CACHE.get(originalExpression)).toEqual([replacedExpression, []]);
    expect(EXPRESSION_CACHES.get(replacedExpression)).toEqual(
      createRuntimeAst(expression, jsep(replacedExpression)),
    );

    clearExpressionCaches(originalExpression, feature, undefined);

    expect(REPLACED_VARIABLES_CACHE.get(originalExpression)).toBeUndefined();
    expect(EXPRESSION_CACHES.get(replacedExpression)).toBeUndefined();
  });
});
