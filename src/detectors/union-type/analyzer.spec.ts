import { describe, it, expect, beforeEach } from "vitest";
import { createAnalyzer } from "./analyzer.js";
import { Context } from "../../core/context.js";
import type { DetectorContext, ReportContext } from "../../types/index.js";
import type { UnionTypeInfo } from "./types.js";

describe("UnionTypeAnalyzer", () => {
  let collectContext: DetectorContext;
  let reportContext: ReportContext;

  beforeEach(() => {
    const globalContext = new Context();
    collectContext = globalContext.createDetectorContext("union-type");
    reportContext = globalContext.createReportContext();
  });

  it("should return empty reports when no duplicates", async () => {
    const analyze = createAnalyzer(2);
    await analyze(collectContext, reportContext);

    expect(reportContext.getReports()).toHaveLength(0);
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

    collectContext.set('"active" | "inactive"', unionTypes);

    const analyze = createAnalyzer(2);
    await analyze(collectContext, reportContext);

    const reports = reportContext.getReports();
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

    collectContext.set('"active" | "inactive"', unionTypes);

    const analyze = createAnalyzer(2);
    await analyze(collectContext, reportContext);

    expect(reportContext.getReports()).toHaveLength(0);
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

    collectContext.set('"active" | "inactive"', unionTypes);

    const analyze = createAnalyzer();
    await analyze(collectContext, reportContext);

    expect(reportContext.getReports()).toHaveLength(1);
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

    collectContext.set('"active" | "inactive"', statusUnions);
    collectContext.set('"admin" | "user"', roleUnions);

    const analyze = createAnalyzer(2);
    await analyze(collectContext, reportContext);

    expect(reportContext.getReports()).toHaveLength(2);
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

    collectContext.set('"active" | "inactive"', manyDuplicates);
    collectContext.set('"admin" | "user"', fewDuplicates);

    const analyze = createAnalyzer(2);
    await analyze(collectContext, reportContext);

    const reports = reportContext.getReports();
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

    collectContext.set('"active" | "inactive"', unionTypes);

    const analyze = createAnalyzer(2);
    await analyze(collectContext, reportContext);

    const reports = reportContext.getReports();
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

    collectContext.set('"active" | "inactive"', unionTypes);

    const analyze = createAnalyzer(2);
    await analyze(collectContext, reportContext);

    const reports = reportContext.getReports();
    expect(reports[0].suggestion).toContain("type alias");
    expect(reports[0].suggestion).toContain('"active" | "inactive"');
  });
});
