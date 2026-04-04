import { describe, it, expect, beforeEach } from "vitest";
import { unionTypeCollector } from "./collector.js";
import { Context } from "../../core/context.js";
import { parseSync } from "oxc-parser";
import type { DetectorContext } from "../../types/index.js";
import type { UnionTypeInfo } from "./types.js";

describe("UnionTypeCollector", () => {
  let context: DetectorContext;
  const filePath = "/test/file.ts";

  beforeEach(() => {
    const globalContext = new Context();
    context = globalContext.createDetectorContext("union-type");
  });

  it("should collect union types", () => {
    const sourceCode = `
type Status = "active" | "inactive";
type Role = "admin" | "user";
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = unionTypeCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    expect(collected.size).toBe(2);
  });

  it("should normalize union types by sorting", () => {
    const sourceCode = `
type A = "inactive" | "active";
type B = "active" | "inactive";
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = unionTypeCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    expect(collected.size).toBe(1);

    const key = '"active" | "inactive"';
    const unionTypes = collected.get(key)!;
    expect(unionTypes).toHaveLength(2);
  });

  it("should handle string literal unions", () => {
    const sourceCode = `
type Status = "pending" | "approved" | "rejected";
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = unionTypeCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    const unionTypes = Array.from(collected.values())[0];

    expect(unionTypes[0].types).toEqual([
      '"approved"',
      '"pending"',
      '"rejected"',
    ]);
  });

  it("should handle type reference unions", () => {
    const sourceCode = `
type Result = Success | Error;
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = unionTypeCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    const unionTypes = Array.from(collected.values())[0];

    expect(unionTypes[0].types).toEqual(["Error", "Success"]);
  });

  it("should handle keyword type unions", () => {
    const sourceCode = `
type Value = string | number | boolean;
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = unionTypeCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    const unionTypes = Array.from(collected.values())[0];

    expect(unionTypes[0].types).toEqual(["boolean", "number", "string"]);
  });

  it("should handle null and undefined unions", () => {
    const sourceCode = `
type Optional = string | null | undefined;
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = unionTypeCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    const unionTypes = Array.from(collected.values())[0];

    expect(unionTypes[0].types).toEqual(["null", "string", "undefined"]);
  });

  it("should skip single type (not a union)", () => {
    const sourceCode = `
type Single = string;
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = unionTypeCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    expect(collected.size).toBe(0);
  });

  it("should collect union types in function parameters", () => {
    const sourceCode = `
function foo(status: "active" | "inactive") {}
function bar(role: "admin" | "user") {}
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = unionTypeCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    expect(collected.size).toBe(2);
  });

  it("should collect union types in variable declarations", () => {
    const sourceCode = `
const status: "active" | "inactive" = "active";
let role: "admin" | "user" = "admin";
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = unionTypeCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    expect(collected.size).toBe(2);
  });

  it("should group duplicate union types", () => {
    const sourceCode = `
function foo(status: "active" | "inactive") {}
function bar(status: "active" | "inactive") {}
function baz(status: "active" | "inactive") {}
`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = unionTypeCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    expect(collected.size).toBe(1);

    const key = '"active" | "inactive"';
    const unionTypes = collected.get(key)!;
    expect(unionTypes).toHaveLength(3);
  });

  it("should handle multiple files", () => {
    const sourceCode1 = `type Status = "active" | "inactive";`;
    const sourceCode2 = `type State = "active" | "inactive";`;
    const filePath1 = "/test/file1.ts";
    const filePath2 = "/test/file2.ts";

    const result1 = parseSync(filePath1, sourceCode1, { lang: "ts" });
    const collector1 = unionTypeCollector(context, filePath1, sourceCode1);
    const visitor1 = collector1.visitor();
    visitor1.visit(result1.program);

    const result2 = parseSync(filePath2, sourceCode2, { lang: "ts" });
    const collector2 = unionTypeCollector(context, filePath2, sourceCode2);
    const visitor2 = collector2.visitor();
    visitor2.visit(result2.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    const key = '"active" | "inactive"';
    const unionTypes = collected.get(key)!;

    expect(unionTypes).toHaveLength(2);
    expect(unionTypes[0].location.file).toBe(filePath1);
    expect(unionTypes[1].location.file).toBe(filePath2);
  });

  it("should store raw union type string", () => {
    const sourceCode = `type Status = "active" | "inactive";`;

    const result = parseSync(filePath, sourceCode, { lang: "ts" });
    const collector = unionTypeCollector(context, filePath, sourceCode);
    const visitor = collector.visitor();
    visitor.visit(result.program);

    const collected = context.getAll<UnionTypeInfo[]>();
    const unionTypes = Array.from(collected.values())[0];

    expect(unionTypes[0].raw).toContain('"active"');
    expect(unionTypes[0].raw).toContain('"inactive"');
  });
});
