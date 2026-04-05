import { describe, it, expect } from "vitest";
import { createUnionTypeDetector } from "./index.js";
import { DetectorTester } from "../../test-utils/index.js";

describe("UnionTypeDetector", () => {
  const detector = createUnionTypeDetector({ minOccurrences: 2 });

  describe("Collection and Analysis", () => {
    it("should detect no duplicates when union types are unique", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type Status = "active" | "inactive";
type Role = "admin" | "user";
      `);

      expect(reports).toHaveLength(0);
    });

    it("should detect duplicates with same union types", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type Status = "active" | "inactive";
function updateStatus(status: "active" | "inactive") {}
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].type).toBe("union-type");
      expect(reports[0].duplicates).toHaveLength(2);
      expect(reports[0].description).toContain('"active" | "inactive"');
      expect(reports[0].description).toContain("2 times");
    });

    it("should detect duplicates regardless of union order", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type A = "approved" | "pending" | "rejected";
type B = "rejected" | "approved" | "pending";
type C = "pending" | "rejected" | "approved";
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(3);
      expect(reports[0].description).toContain(
        '"approved" | "pending" | "rejected"',
      );
    });

    it("should detect duplicates with keyword types in different order", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type A = string | number | boolean;
type B = boolean | string | number;
type C = number | boolean | string;
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(3);
    });

    it("should respect minOccurrences configuration", async () => {
      const detectorWith3 = createUnionTypeDetector({ minOccurrences: 3 });
      const tester = new DetectorTester(detectorWith3);
      const reports = await tester.testSingleFile(`
type A = "active" | "inactive";
type B = "active" | "inactive";
      `);

      expect(reports).toHaveLength(0);
    });

    it("should detect multiple different union type duplicates", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type Status1 = "active" | "inactive";
type Status2 = "active" | "inactive";
type Role1 = "admin" | "user";
type Role2 = "admin" | "user";
      `);

      expect(reports).toHaveLength(2);
    });

    it("should sort reports by duplicate count descending", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type S1 = "active" | "inactive";
type S2 = "active" | "inactive";
type S3 = "active" | "inactive";
type S4 = "active" | "inactive";
type S5 = "active" | "inactive";

type R1 = "admin" | "user";
type R2 = "admin" | "user";
      `);

      expect(reports).toHaveLength(2);
      expect(reports[0].duplicates).toHaveLength(5);
      expect(reports[1].duplicates).toHaveLength(2);
    });

    it("should handle union types in function parameters", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
function foo(status: "active" | "inactive") {}
function bar(status: "active" | "inactive") {}
function baz(status: "active" | "inactive") {}
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(3);
    });

    it("should handle union types in variable declarations", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const status: "active" | "inactive" = "active";
let role: "active" | "inactive" = "active";
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(2);
    });

    it("should handle type reference unions", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type Result1 = Success | Error;
type Result2 = Error | Success;
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(2);
    });

    it("should handle null and undefined unions", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type Optional1 = string | null | undefined;
type Optional2 = undefined | string | null;
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(2);
    });

    it("should skip single type (not a union)", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type Single = string;
      `);

      expect(reports).toHaveLength(0);
    });

    it("should handle multiple files", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.test([
        {
          path: "/test/file1.ts",
          code: 'type Status = "active" | "inactive";',
        },
        {
          path: "/test/file2.ts",
          code: 'type State = "active" | "inactive";',
        },
      ]);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(2);
      expect(reports[0].duplicates[0].location.file).toBe("/test/file1.ts");
      expect(reports[0].duplicates[1].location.file).toBe("/test/file2.ts");
    });

    it("should include metadata in duplicate entries", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type Status1 = "active" | "inactive";
type Status2 = "active" | "inactive";
      `);

      expect(reports).toHaveLength(1);
      const duplicate = reports[0].duplicates[0];
      expect(duplicate.metadata).toHaveProperty("types");
      expect(duplicate.metadata).toHaveProperty("raw");
    });

    it("should generate appropriate suggestion", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type Status1 = "active" | "inactive";
type Status2 = "active" | "inactive";
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].suggestion).toContain("type alias");
      expect(reports[0].suggestion).toContain('"active" | "inactive"');
    });

    it("should store location information correctly", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
type Status = "active" | "inactive";
function foo(s: "active" | "inactive") {}
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates[0].location.start.line).toBe(2);
      expect(reports[0].duplicates[1].location.start.line).toBe(3);
    });

    it("should use default minOccurrences of 2", async () => {
      const defaultDetector = createUnionTypeDetector();
      const tester = new DetectorTester(defaultDetector);
      const reports = await tester.testSingleFile(`
type A = "active" | "inactive";
type B = "active" | "inactive";
      `);

      expect(reports).toHaveLength(1);
    });
  });
});
