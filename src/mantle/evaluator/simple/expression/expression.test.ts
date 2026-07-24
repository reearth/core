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

  test("should evaluate expression with quoted property names containing spaces", () => {
    const expressionString = '${"user name"}';
    const feature = {
      properties: {
        "user name": "Alice",
        "user age": 25,
      },
    } as Feature;

    const expression = new Expression(expressionString, feature);
    const result = expression.evaluate();

    expect(result).toBe("Alice");
  });

  test("should evaluate conditional expression with quoted property names", () => {
    const expressionString = '${"user score"} > 50 ? "Pass" : "Fail"';
    const feature1 = {
      properties: {
        "user score": 75,
      },
    } as Feature;
    const feature2 = {
      properties: {
        "user score": 30,
      },
    } as Feature;

    const expression1 = new Expression(expressionString, feature1);
    const expression2 = new Expression(expressionString, feature2);

    expect(expression1.evaluate()).toBe("Pass");
    expect(expression2.evaluate()).toBe("Fail");
  });

  test("should evaluate arithmetic expression with quoted property names", () => {
    const expressionString = '${"item price"} * ${"item quantity"}';
    const feature = {
      properties: {
        "item price": 10.5,
        "item quantity": 3,
      },
    } as Feature;

    const expression = new Expression(expressionString, feature);
    const result = expression.evaluate();

    expect(result).toBe(31.5);
  });

  test("should handle quoted property names with special characters", () => {
    const expressionString = '${"user-info:name"} === "Bob Smith"';
    const feature = {
      properties: {
        "user-info:name": "Bob Smith",
        "email@address": "bob@example.com",
      },
    } as Feature;

    const expression = new Expression(expressionString, feature);
    const result = expression.evaluate();

    expect(result).toBe(true);
  });
});

describe("hyphenated property names", () => {
  test("${post-code} root property with hyphen", () => {
    const feature = {
      properties: { "post-code": "123-456" },
    } as Feature;
    expect(new Expression("${post-code}", feature).evaluate()).toBe("123-456");
  });

  test("${address.post-code} property with hyphen inside a group via dot notation", () => {
    const feature = {
      properties: { address: { "post-code": "150-0001", city: "Tokyo" } },
    } as Feature;
    expect(new Expression("${address.post-code}", feature).evaluate()).toBe("150-0001");
  });

  test("${post-code.zip} hyphen in group name, plain member", () => {
    const feature = {
      properties: { "post-code": { zip: "999" } },
    } as Feature;
    expect(new Expression("${post-code.zip}", feature).evaluate()).toBe("999");
  });

  test("${post-code.zip-code} both group name and property have hyphens", () => {
    const feature = {
      properties: { "post-code": { "zip-code": "100-0001" } },
    } as Feature;
    expect(new Expression("${post-code.zip-code}", feature).evaluate()).toBe("100-0001");
  });

  test("${address['post-code']} bracket notation still works", () => {
    const feature = {
      properties: { address: { "post-code": "150-0001" } },
    } as Feature;
    expect(new Expression("${address['post-code']}", feature).evaluate()).toBe("150-0001");
  });

  test("${address.city} plain dot access without hyphen still works", () => {
    const feature = {
      properties: { address: { "post-code": "150-0001", city: "Tokyo" } },
    } as Feature;
    expect(new Expression("${address.city}", feature).evaluate()).toBe("Tokyo");
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
