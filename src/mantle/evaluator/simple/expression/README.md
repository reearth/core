# Expression Evaluator

A powerful expression evaluator for evaluating dynamic expressions with feature properties, supporting various operators, functions, and property access methods.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Property Access](#property-access)
- [Operators](#operators)
- [Functions](#functions)
- [Data Types](#data-types)
- [Advanced Features](#advanced-features)

## Basic Usage

```typescript
import { Expression } from "./expression";

const feature = {
  properties: {
    height: 100,
    name: "Building A",
  },
};

const expr = new Expression("${height} > 50", feature);
const result = expr.evaluate(); // true
```

## Property Access

### 1. Standard Property Names (No Spaces)

For properties without spaces or special characters, use the simple syntax:

```typescript
${propertyName}
${height}
${temperature}
```

**Example:**
```typescript
const feature = {
  properties: {
    height: 100,
    width: 50,
  },
};

const expr = new Expression("${height} * ${width}", feature);
expr.evaluate(); // 5000
```

### 2. Quoted Property Names (With Spaces)

**✨ NEW:** For properties with spaces or special characters, wrap the property name in quotes:

```typescript
${"property name"}      // Double quotes (recommended)
${'property name'}      // Single quotes
```

**Example:**
```typescript
const feature = {
  properties: {
    "user name": "Alice",
    "user score": 95,
    "email@address": "alice@example.com",
    "user-info:age": 25,
  },
};

// Access properties with spaces
const expr1 = new Expression('${"user name"}', feature);
expr1.evaluate(); // "Alice"

// Use in conditionals
const expr2 = new Expression('${"user score"} > 90 ? "Excellent" : "Good"', feature);
expr2.evaluate(); // "Excellent"

// Arithmetic operations
const expr3 = new Expression('${"user-info:age"} + 5', feature);
expr3.evaluate(); // 30

// Properties with special characters
const expr4 = new Expression('${"email@address"} !== ""', feature);
expr4.evaluate(); // true
```

**Supported Characters in Quoted Names:**
- Spaces: `${"user name"}`
- Hyphens: `${"user-info"}`
- Colons: `${"category:name"}`
- At signs: `${"email@domain"}`
- Any other special characters

### 3. Special Variables

```typescript
${id}              // Access feature.id
${rootProperties}  // Access entire feature.properties object
```

**Example:**
```typescript
const feature = {
  id: "feature-123",
  properties: {
    height: 100,
  },
};

const expr = new Expression('${id}', feature);
expr.evaluate(); // "feature-123"
```

## Operators

### Comparison Operators

```typescript
${height} > 50          // Greater than
${height} >= 50         // Greater than or equal
${height} < 100         // Less than
${height} <= 100        // Less than or equal
${height} === 50        // Strict equality
${height} !== 50        // Strict inequality
${height} == 50         // Loose equality (with type coercion)
${height} != 50         // Loose inequality
```

### Arithmetic Operators

```typescript
${a} + ${b}            // Addition
${a} - ${b}            // Subtraction
${a} * ${b}            // Multiplication
${a} / ${b}            // Division
${a} % ${b}            // Modulo
```

### Logical Operators

```typescript
${a} && ${b}           // Logical AND
${a} || ${b}           // Logical OR
!${a}                  // Logical NOT
```

### Conditional (Ternary) Operator

```typescript
${condition} ? ${trueValue} : ${falseValue}
```

**Example:**
```typescript
const expr = new Expression('${height} > 100 ? "Tall" : "Short"', feature);
```

## Functions

### Type Conversion Functions

```typescript
Boolean(${value})      // Convert to boolean
Number(${value})       // Convert to number
String(${value})       // Convert to string
```

### Math Functions

```typescript
abs(${value})          // Absolute value
sqrt(${value})         // Square root
ceil(${value})         // Round up
floor(${value})        // Round down
round(${value})        // Round to nearest integer
sin(${value})          // Sine
cos(${value})          // Cosine
tan(${value})          // Tangent
```

### Utility Functions

```typescript
isNaN(${value})        // Check if Not a Number
isFinite(${value})     // Check if finite number
```

### Color Functions

```typescript
color("red")                           // Named color
color("#ff0000")                       // Hex color
color("#ff0000", 0.5)                  // Hex color with alpha
rgb(255, 0, 0)                         // RGB color
rgba(255, 0, 0, 0.5)                   // RGBA color
hsl(0, 100, 50)                        // HSL color
hsla(0, 100, 50, 0.5)                  // HSLA color
```

**Example:**
```typescript
const expr = new Expression('${height} > 100 ? color("red") : color("blue")', feature);
```

## Data Types

### Supported Types

- **Numbers**: `42`, `3.14`, `Infinity`, `NaN`
- **Strings**: `"hello"`, `'world'`
- **Booleans**: `true`, `false`
- **Null**: `null`
- **Undefined**: `undefined`
- **Arrays**: `[1, 2, 3]`
- **Colors**: Result of color functions

### Constants

```typescript
Math.PI                // 3.141592653589793
Math.E                 // 2.718281828459045
Number.POSITIVE_INFINITY
NaN
Infinity
undefined
```

## Advanced Features

### String Interpolation

Within string literals, you can interpolate property values:

```typescript
"Hello, ${name}!"
"Height: ${height}m"
```

**Example:**
```typescript
const feature = {
  properties: {
    name: "Building A",
    height: 100,
  },
};

const expr = new Expression('"Building: ${name}, Height: ${height}m"', feature);
expr.evaluate(); // "Building: Building A, Height: 100m"
```

### Array Comparisons

The equality operators support checking if a value is in an array:

```typescript
${value} == [1, 2, 3]      // Check if value is in array
${value} != [1, 2, 3]      // Check if value is not in array
```

**Example:**
```typescript
const feature = {
  properties: {
    status: "active",
  },
};

const expr = new Expression('${status} == ["active", "pending"]', feature);
expr.evaluate(); // true
```

### Defines (Variable Substitution)

You can define placeholder values that get substituted before evaluation:

```typescript
const defines = {
  MAX_HEIGHT: "100",
  MIN_HEIGHT: "10",
};

const expr = new Expression("${height} > ${MAX_HEIGHT}", feature, defines);
// Becomes: "${height} > 100"
```

### Expression Caching

Expressions are cached automatically for better performance. To clear caches:

```typescript
import { clearExpressionCaches } from "./expression";

clearExpressionCaches(expressionString, feature, defines);
```

## Property Name Comparison

| Syntax | Use Case | Example |
|--------|----------|---------|
| `${name}` | Simple properties (no spaces) | `${height}`, `${temperature}` |
| `${"property name"}` | Properties with spaces/special chars | `${"user name"}`, `${"email@domain"}` |
| `${rootProperties}` | Access entire properties object | `${rootProperties["dynamic-key"]}` |

## Complete Example

```typescript
import { Expression } from "./expression";

const feature = {
  id: "building-001",
  properties: {
    "building name": "Tower A",
    "building height": 150,
    "building color": "blue",
    floors: 30,
    status: "active",
    "contact info": {
      "email address": "info@tower-a.com",
    },
  },
};

// Simple comparison
const expr1 = new Expression('${"building height"} > 100', feature);
console.log(expr1.evaluate()); // true

// Conditional with color
const expr2 = new Expression(
  '${"building height"} > 100 ? color("red") : color("green")',
  feature
);
console.log(expr2.evaluate()); // #ff0000 (red)

// String interpolation
const expr3 = new Expression(
  '"${"building name"} has ${floors} floors"',
  feature
);
console.log(expr3.evaluate()); // "Tower A has 30 floors"

// Array membership check
const expr4 = new Expression(
  '${status} == ["active", "pending"]',
  feature
);
console.log(expr4.evaluate()); // true
```

## Migration Guide

### From Standard Syntax to Quoted Syntax

If you have properties with spaces, you need to update your expressions:

**Before (doesn't work):**
```typescript
${user name}           // ❌ Fails: interpreted as two separate identifiers
```

**After (works):**
```typescript
${"user name"}         // ✅ Works: quoted property name
```

### Best Practices

1. **Use simple syntax** for properties without spaces: `${height}`
2. **Use quoted syntax** for properties with spaces: `${"user name"}`
3. **Prefer double quotes** for consistency: `${"property"}` instead of `${'property'}`
4. **Avoid special characters in property names** when possible to keep expressions simple
