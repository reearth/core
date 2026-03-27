import { describe, test, expect } from "vitest";

import { replaceVariables } from "./variableReplacer";

describe("replaceVariables", () => {
  test("should replace the variable placeholders with the corresponding variable names in the expression string", () => {
    const [result, _] = replaceVariables("${variable}");
    expect(result).toBe("czm_variable");
  });

  test("should handle multiple variable placeholders in the expression string", () => {
    const [result, _] = replaceVariables("${variable1} + ${variable2}");
    expect(result).toBe("czm_variable1 + czm_variable2");
  });

  test("should handle JSONPath palceholders in the expression string", () => {
    const [, res] = replaceVariables("${$.phoneNumbers[:1].type}", {
      id: "blah",
      firstName: "John",
      lastName: "doe",
      age: 26,
      address: {
        streetAddress: "naist street",
        city: "Nara",
        postalCode: "630-0192",
      },
      phoneNumbers: [
        {
          type: "iPhone",
          number: "0123-4567-8888",
        },
        {
          type: "home",
          number: "0123-4567-8910",
        },
      ],
    });
    expect(res[0].literalValue).toBe("iPhone");
  });

  test("should replace reserved word", () => {
    const [result, _] = replaceVariables(
      "${va[ria]ble} + ${variable[0]} + ${variable['key']} + ${variable[\"key\"]} + ${variable[variable]} + ${variable[variable].nested} + ${variable[variable]['nested']}",
    );
    expect(result).toBe(
      `czm_va$reearth_opened_square_bracket_$ria$reearth_closed_square_bracket_$ble + czm_variable[0] + czm_variable['key'] + czm_variable["key"] + czm_variable[variable] + czm_variable[variable].nested + czm_variable[variable]['nested']`,
    );
  });

  test("should replace reserved hyphen", () => {
    const [result, _] = replaceVariables("${vari-able}");
    expect(result).toBe(`czm_vari$reearth_hyphen_$able`);
  });

  test("should handle property names with spaces using bracket notation with double quotes", () => {
    const [, res] = replaceVariables('${$["property name"]}', {
      "property name": "value with space",
      normalProperty: "normal value",
    });
    expect(res[0].literalValue).toBe("value with space");
  });

  test("should handle property names with spaces using bracket notation with single quotes", () => {
    const [, res] = replaceVariables("${$['user name']}", {
      "user name": "John Doe",
      normalProperty: "normal value",
    });
    expect(res[0].literalValue).toBe("John Doe");
  });

  test("should handle nested property names with spaces", () => {
    const [, res] = replaceVariables('${$["contact info"]["email address"]}', {
      "contact info": {
        "email address": "john@example.com",
        "phone number": "123-456-7890",
      },
    });
    expect(res[0].literalValue).toBe("john@example.com");
  });

  test("should handle array elements with property names containing spaces", () => {
    const [, res] = replaceVariables('${$.items[0]["item name"]}', {
      items: [
        { "item name": "Product A", "item price": 100 },
        { "item name": "Product B", "item price": 200 },
      ],
    });
    expect(res[0].literalValue).toBe("Product A");
  });

  test("should handle array slice with property names containing spaces", () => {
    const [, res] = replaceVariables('${$.items[:1]["item price"]}', {
      items: [
        { "item name": "Product A", "item price": 100 },
        { "item name": "Product B", "item price": 200 },
      ],
    });
    expect(res[0].literalValue).toBe(100);
  });

  test("should handle quoted dot notation for property names with spaces", () => {
    const [, res] = replaceVariables("${$.'property name'}", {
      "property name": "value with space",
    });
    expect(res[0].literalValue).toBe("value with space");
  });

  test("should handle multiple property names with spaces in one expression", () => {
    const [result, res] = replaceVariables('${$["user name"]} - ${$["property name"]}', {
      "user name": "John Doe",
      "property name": "value with space",
    });
    expect(res).toHaveLength(2);
    expect(res[0].literalValue).toBe("John Doe");
    expect(res[1].literalValue).toBe("value with space");
    expect(result).toContain(res[0].literalName);
    expect(result).toContain(res[1].literalName);
  });

  test("should handle quoted property names with double quotes", () => {
    const [result, res] = replaceVariables('${"user info"}', {
      "user info": "John Doe",
      normalProperty: "normal value",
    });
    expect(res).toHaveLength(1);
    expect(res[0].literalValue).toBe("John Doe");
    expect(result).toBe(res[0].literalName);
  });

  test("should handle quoted property names with single quotes", () => {
    const [result, res] = replaceVariables("${'property name'}", {
      "property name": "value with space",
      normalProperty: "normal value",
    });
    expect(res).toHaveLength(1);
    expect(res[0].literalValue).toBe("value with space");
    expect(result).toBe(res[0].literalName);
  });

  test("should handle multiple quoted property names in one expression", () => {
    const [result, res] = replaceVariables('${"user name"} - ${"user age"}', {
      "user name": "John Doe",
      "user age": 30,
    });
    expect(res).toHaveLength(2);
    expect(res[0].literalValue).toBe("John Doe");
    expect(res[1].literalValue).toBe(30);
    expect(result).toContain(res[0].literalName);
    expect(result).toContain("-");
    expect(result).toContain(res[1].literalName);
  });

  test("should handle quoted property names with special characters", () => {
    const [result, res] = replaceVariables('${"user-info:name"}', {
      "user-info:name": "Jane Smith",
    });
    expect(res).toHaveLength(1);
    expect(res[0].literalValue).toBe("Jane Smith");
    expect(result).toBe(res[0].literalName);
  });

  test("should reject mismatched quote types (double to single)", () => {
    const [result, res] = replaceVariables("${\"user info'}", {
      "user info": "John Doe",
    });
    // Should not match the quoted pattern, should fall back to variable name
    expect(result).toContain("czm_");
    expect(res).toHaveLength(0);
  });

  test("should reject mismatched quote types (single to double)", () => {
    const [result, res] = replaceVariables("${'user info\"}", {
      "user info": "Jane Doe",
    });
    // Should not match the quoted pattern, should fall back to variable name
    expect(result).toContain("czm_");
    expect(res).toHaveLength(0);
  });

  test("should correctly handle consecutive properties with different quote types", () => {
    const [result, res] = replaceVariables("${\"prop1\"} + ${'prop2'}", {
      prop1: "value1",
      prop2: "value2",
    });
    expect(res).toHaveLength(2);
    expect(res[0].literalValue).toBe("value1");
    expect(res[1].literalValue).toBe("value2");
    expect(result).toContain(res[0].literalName);
    expect(result).toContain("+");
    expect(result).toContain(res[1].literalName);
  });

  test("should return empty string when quoted property is missing (consistent with regular variables)", () => {
    const [result, res] = replaceVariables('${"missing"}', {
      existing: "value",
    });
    // Returns empty string for missing quoted property (consistent with regular variables)
    expect(res).toHaveLength(1);
    expect(res[0].literalValue).toBe("");
    expect(result).toBe(res[0].literalName);
  });

  test("should pass through regular variable name when property might be missing", () => {
    const [result, res] = replaceVariables("${missing}");
    // Regular variables are passed through as czm_variableName
    // They will be evaluated later by Node._evaluateVariable
    expect(result).toBe("czm_missing");
    expect(res).toHaveLength(0);
  });

  test("should return empty string for missing JSONPath properties (consistent with regular variables)", () => {
    const [result, res] = replaceVariables("${$.missingPath}", {
      existing: "value",
    });
    // Returns empty string for missing JSONPath property
    expect(res).toHaveLength(1);
    expect(res[0].literalValue).toBe("");
    expect(result).toBe(res[0].literalName);
  });

  test("should handle mixed existing and missing properties consistently", () => {
    const [result, res] = replaceVariables('${"existing"} - ${"missing"}', {
      existing: "value",
    });
    expect(res).toHaveLength(2);
    expect(res[0].literalValue).toBe("value");
    expect(res[1].literalValue).toBe(""); // Missing property returns empty string
    expect(result).toContain(res[0].literalName);
    expect(result).toContain("-");
    expect(result).toContain(res[1].literalName);
  });
});
