import { describe, it, expect, beforeEach } from "vitest";
import { MagicNumberAnalyzer } from "./analyzer.js";
import { Context } from "../../core/context.js";
import type { GlobalContext } from "../../types/index.js";
import type { ConstantLiteral } from "./types.js";

describe("MagicNumberAnalyzer", () => {
  let context: GlobalContext;
  const namespace = "magic-number";

  beforeEach(() => {
    context = new Context();
  });

  it("should return empty reports when no duplicates", () => {
    const analyzer = new MagicNumberAnalyzer(3);
    const reports = analyzer.analyze(context);

    expect(reports).resolves.toHaveLength(0);
  });

  it("should detect duplicates with minOccurrences", async () => {
    const literals: ConstantLiteral[] = [
      {
        id: "1",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "2",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "3",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file3.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
    ];

    context.set(namespace, "number:5000", literals);

    const analyzer = new MagicNumberAnalyzer(3);
    const reports = await analyzer.analyze(context);

    expect(reports).toHaveLength(1);
    expect(reports[0].type).toBe("magic-number");
    expect(reports[0].similarity).toBe(100);
    expect(reports[0].duplicates).toHaveLength(3);
    expect(reports[0].description).toContain("5000");
    expect(reports[0].description).toContain("3 times");
  });

  it("should not report duplicates below minOccurrences", async () => {
    const literals: ConstantLiteral[] = [
      {
        id: "1",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "2",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
    ];

    context.set(namespace, "number:5000", literals);

    const analyzer = new MagicNumberAnalyzer(3);
    const reports = await analyzer.analyze(context);

    expect(reports).toHaveLength(0);
  });

  it("should use default minOccurrences of 3", async () => {
    const literals: ConstantLiteral[] = [
      {
        id: "1",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "2",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "3",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file3.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
    ];

    context.set(namespace, "number:5000", literals);

    const analyzer = new MagicNumberAnalyzer();
    const reports = await analyzer.analyze(context);

    expect(reports).toHaveLength(1);
  });

  it("should handle multiple different magic numbers", async () => {
    const literals5000: ConstantLiteral[] = [
      {
        id: "1",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "2",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "3",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file3.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
    ];

    const literals3000: ConstantLiteral[] = [
      {
        id: "4",
        value: 3000,
        type: "number",
        location: {
          file: "/test/file1.ts",
          start: { line: 2, column: 0 },
          end: { line: 2, column: 4 },
        },
      },
      {
        id: "5",
        value: 3000,
        type: "number",
        location: {
          file: "/test/file2.ts",
          start: { line: 2, column: 0 },
          end: { line: 2, column: 4 },
        },
      },
      {
        id: "6",
        value: 3000,
        type: "number",
        location: {
          file: "/test/file3.ts",
          start: { line: 2, column: 0 },
          end: { line: 2, column: 4 },
        },
      },
    ];

    context.set(namespace, "number:5000", literals5000);
    context.set(namespace, "number:3000", literals3000);

    const analyzer = new MagicNumberAnalyzer(3);
    const reports = await analyzer.analyze(context);

    expect(reports).toHaveLength(2);
  });

  it("should sort reports by duplicate count descending", async () => {
    const literals5000: ConstantLiteral[] = Array.from(
      { length: 5 },
      (_, i) => ({
        id: `${i}`,
        value: 5000,
        type: "number" as const,
        location: {
          file: `/test/file${i}.ts`,
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      }),
    );

    const literals3000: ConstantLiteral[] = Array.from(
      { length: 3 },
      (_, i) => ({
        id: `${i + 5}`,
        value: 3000,
        type: "number" as const,
        location: {
          file: `/test/file${i}.ts`,
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      }),
    );

    context.set(namespace, "number:5000", literals5000);
    context.set(namespace, "number:3000", literals3000);

    const analyzer = new MagicNumberAnalyzer(3);
    const reports = await analyzer.analyze(context);

    expect(reports[0].duplicates).toHaveLength(5);
    expect(reports[1].duplicates).toHaveLength(3);
  });

  it("should include metadata in duplicate entries", async () => {
    const literals: ConstantLiteral[] = [
      {
        id: "1",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "2",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "3",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file3.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
    ];

    context.set(namespace, "number:5000", literals);

    const analyzer = new MagicNumberAnalyzer(3);
    const reports = await analyzer.analyze(context);

    const duplicate = reports[0].duplicates[0];
    expect(duplicate.metadata).toEqual({
      value: 5000,
      type: "number",
    });
  });

  it("should generate appropriate suggestion", async () => {
    const literals: ConstantLiteral[] = [
      {
        id: "1",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "2",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "3",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file3.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
    ];

    context.set(namespace, "number:5000", literals);

    const analyzer = new MagicNumberAnalyzer(3);
    const reports = await analyzer.analyze(context);

    expect(reports[0].suggestion).toContain("magic number");
    expect(reports[0].suggestion).toContain("5000");
    expect(reports[0].suggestion).toContain("named constant");
  });

  it("should handle custom minOccurrences value", async () => {
    const literals: ConstantLiteral[] = [
      {
        id: "1",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file1.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
      {
        id: "2",
        value: 5000,
        type: "number",
        location: {
          file: "/test/file2.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 4 },
        },
      },
    ];

    context.set(namespace, "number:5000", literals);

    const analyzer = new MagicNumberAnalyzer(2);
    const reports = await analyzer.analyze(context);

    expect(reports).toHaveLength(1);
    expect(reports[0].duplicates).toHaveLength(2);
  });
});
