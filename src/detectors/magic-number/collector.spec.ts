import { describe, it, expect, beforeEach } from "vitest";
import { MagicNumberCollector } from "./collector.js";
import { Context } from "../../core/context.js";
import { parseSync } from "oxc-parser";
import type { GlobalContext } from "../../types/index.js";
import type { ConstantLiteral } from "./types.js";

describe("MagicNumberCollector", () => {
  let context: GlobalContext;
  const filePath = "/test/file.ts";

  beforeEach(() => {
    context = new Context();
  });

  it("should collect magic numbers", () => {
    const sourceCode = `
const timeout = 5000;
const delay = 3000;
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = new MagicNumberCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<ConstantLiteral[]>("magic-number");
    expect(collected.size).toBe(2);

    const timeoutKey = "number:5000";
    const delayKey = "number:3000";

    expect(collected.has(timeoutKey)).toBe(true);
    expect(collected.has(delayKey)).toBe(true);

    const timeoutLiterals = collected.get(timeoutKey)!;
    expect(timeoutLiterals).toHaveLength(1);
    expect(timeoutLiterals[0].value).toBe(5000);
    expect(timeoutLiterals[0].type).toBe("number");
  });

  it("should skip 0, 1, -1", () => {
    const sourceCode = `
const zero = 0;
const one = 1;
const minusOne = -1;
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = new MagicNumberCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<ConstantLiteral[]>("magic-number");
    expect(collected.size).toBe(0);
  });

  it("should skip integers 2-10", () => {
    const sourceCode = `
const two = 2;
const five = 5;
const ten = 10;
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = new MagicNumberCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<ConstantLiteral[]>("magic-number");
    expect(collected.size).toBe(0);
  });

  it("should collect numbers outside 2-10 range", () => {
    const sourceCode = `
const eleven = 11;
const hundred = 100;
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = new MagicNumberCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<ConstantLiteral[]>("magic-number");
    expect(collected.size).toBe(2);
    expect(collected.has("number:11")).toBe(true);
    expect(collected.has("number:100")).toBe(true);
  });

  it("should collect decimal numbers", () => {
    const sourceCode = `
const pi = 3.14;
const ratio = 0.5;
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = new MagicNumberCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<ConstantLiteral[]>("magic-number");
    expect(collected.size).toBe(2);
    expect(collected.has("number:3.14")).toBe(true);
    expect(collected.has("number:0.5")).toBe(true);
  });

  it("should collect numbers from unary expressions", () => {
    const sourceCode = `
const negative = -100;
const minusEleven = -11;
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = new MagicNumberCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<ConstantLiteral[]>("magic-number");
    expect(collected.size).toBe(2);
    expect(collected.has("number:100")).toBe(true);
    expect(collected.has("number:11")).toBe(true);
  });

  it("should group duplicate numbers", () => {
    const sourceCode = `
const timeout1 = 5000;
const timeout2 = 5000;
const timeout3 = 5000;
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = new MagicNumberCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<ConstantLiteral[]>("magic-number");
    expect(collected.size).toBe(1);

    const timeoutLiterals = collected.get("number:5000")!;
    expect(timeoutLiterals).toHaveLength(3);
  });

  it("should store correct location information", () => {
    const sourceCode = `const timeout = 5000;`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = new MagicNumberCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<ConstantLiteral[]>("magic-number");
    const literals = collected.get("number:5000")!;

    expect(literals[0].location.file).toBe(filePath);
    expect(literals[0].location.start.line).toBe(1);
    expect(literals[0].location.start.column).toBe(16);
  });

  it("should handle multiple files", () => {
    const sourceCode1 = `const timeout = 5000;`;
    const sourceCode2 = `const delay = 5000;`;
    const filePath1 = "/test/file1.ts";
    const filePath2 = "/test/file2.ts";

    const result1 = parseSync(filePath1, sourceCode1, { lang: "ts" });
    const collector1 = new MagicNumberCollector(
      context,
      filePath1,
      sourceCode1,
    );
    const visitor1 = collector1.visitor();
    visitor1.visit(result1.program);

    const result2 = parseSync(filePath2, sourceCode2, { lang: "ts" });
    const collector2 = new MagicNumberCollector(
      context,
      filePath2,
      sourceCode2,
    );
    const visitor2 = collector2.visitor();
    visitor2.visit(result2.program);

    const collected = context.getAll<ConstantLiteral[]>("magic-number");
    const literals = collected.get("number:5000")!;

    expect(literals).toHaveLength(2);
    expect(literals[0].location.file).toBe(filePath1);
    expect(literals[1].location.file).toBe(filePath2);
  });

  it("should skip null values", () => {
    const sourceCode = `const value = null;`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = new MagicNumberCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<ConstantLiteral[]>("magic-number");
    expect(collected.size).toBe(0);
  });
});
