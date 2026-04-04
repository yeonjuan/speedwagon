import { describe, it, expect, beforeEach } from "vitest";
import { UnionTypeAnalyzer } from "./analyzer.js";
import { Context } from "../../core/context.js";
import type { GlobalContext } from "../../types/index.js";
import type { UnionTypeInfo } from "./types.js";

describe("UnionTypeAnalyzer", () => {
  let context: GlobalContext;
  const namespace = "union-type";

  beforeEach(() => {
    context = new Context();
  });

  it("should return empty reports when no duplicates", () => {
    const analyzer = new UnionTypeAnalyzer(2);
    const reports = analyzer.analyze(context);

    expect(reports).resolves.toHaveLength(0);
  });

  it("should detect duplicates with minOccurrences", async () => {
    const unionTypes: UnionTypeInfo[] = [
      {
        id: "1",
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      },
      {
        id: "2",
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      },
    ];

    context.set(namespace, '"active" | "inactive"', unionTypes);

    const analyzer = new UnionTypeAnalyzer(2);
    const reports = await analyzer.analyze(context);

    expect(reports).toHaveLength(1);
    expect(reports[0].type).toBe("union-type");
    expect(reports[0].similarity).toBe(100);
    expect(reports[0].duplicates).toHaveLength(2);
    expect(reports[0].description).toContain('"active" | "inactive"');
    expect(reports[0].description).toContain("2 times");
  });

  it("should not report duplicates below minOccurrences", async () => {
    const unionTypes: UnionTypeInfo[] = [
      {
        id: "1",
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      },
    ];

    context.set(namespace, '"active" | "inactive"', unionTypes);

    const analyzer = new UnionTypeAnalyzer(2);
    const reports = await analyzer.analyze(context);

    expect(reports).toHaveLength(0);
  });

  it("should use default minOccurrences of 2", async () => {
    const unionTypes: UnionTypeInfo[] = [
      {
        id: "1",
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      },
      {
        id: "2",
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      },
    ];

    context.set(namespace, '"active" | "inactive"', unionTypes);

    const analyzer = new UnionTypeAnalyzer();
    const reports = await analyzer.analyze(context);

    expect(reports).toHaveLength(1);
  });

  it("should handle multiple different union types", async () => {
    const statusUnions: UnionTypeInfo[] = [
      {
        id: "1",
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      },
      {
        id: "2",
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      },
    ];

    const roleUnions: UnionTypeInfo[] = [
      {
        id: "3",
        types: ['"admin"', '"user"'],
        raw: '"admin" | "user"',
        location: {
          file: "/test/file1.ts",
          start: { line: 2, column: 0 },
          end: { line: 2, column: 20 },
        },
      },
      {
        id: "4",
        types: ['"admin"', '"user"'],
        raw: '"admin" | "user"',
        location: {
          file: "/test/file2.ts",
          start: { line: 2, column: 0 },
          end: { line: 2, column: 20 },
        },
      },
    ];

    context.set(namespace, '"active" | "inactive"', statusUnions);
    context.set(namespace, '"admin" | "user"', roleUnions);

    const analyzer = new UnionTypeAnalyzer(2);
    const reports = await analyzer.analyze(context);

    expect(reports).toHaveLength(2);
  });

  it("should sort reports by duplicate count descending", async () => {
    const manyDuplicates: UnionTypeInfo[] = Array.from(
      { length: 5 },
      (_, i) => ({
        id: `${i}`,
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: `/test/file${i}.ts`,
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      }),
    );

    const fewDuplicates: UnionTypeInfo[] = Array.from(
      { length: 2 },
      (_, i) => ({
        id: `${i + 5}`,
        types: ['"admin"', '"user"'],
        raw: '"admin" | "user"',
        location: {
          file: `/test/file${i}.ts`,
          start: { line: 1, column: 0 },
          end: { line: 1, column: 20 },
        },
      }),
    );

    context.set(namespace, '"active" | "inactive"', manyDuplicates);
    context.set(namespace, '"admin" | "user"', fewDuplicates);

    const analyzer = new UnionTypeAnalyzer(2);
    const reports = await analyzer.analyze(context);

    expect(reports[0].duplicates).toHaveLength(5);
    expect(reports[1].duplicates).toHaveLength(2);
  });

  it("should include metadata in duplicate entries", async () => {
    const unionTypes: UnionTypeInfo[] = [
      {
        id: "1",
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      },
      {
        id: "2",
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      },
    ];

    context.set(namespace, '"active" | "inactive"', unionTypes);

    const analyzer = new UnionTypeAnalyzer(2);
    const reports = await analyzer.analyze(context);

    const duplicate = reports[0].duplicates[0];
    expect(duplicate.metadata).toHaveProperty("types");
    expect(duplicate.metadata).toHaveProperty("raw");
  });

  it("should generate appropriate suggestion", async () => {
    const unionTypes: UnionTypeInfo[] = [
      {
        id: "1",
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      },
      {
        id: "2",
        types: ['"active"', '"inactive"'],
        raw: '"active" | "inactive"',
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 25 },
        },
      },
    ];

    context.set(namespace, '"active" | "inactive"', unionTypes);

    const analyzer = new UnionTypeAnalyzer(2);
    const reports = await analyzer.analyze(context);

    expect(reports[0].suggestion).toContain("type alias");
    expect(reports[0].suggestion).toContain('"active" | "inactive"');
  });
});
