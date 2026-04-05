import { describe, it, expect } from "vitest";
import { createStringLiteralDetector } from "./index.js";
import { DetectorTester } from "../../test-utils/detector-tester.js";

describe("StringLiteralDetector", () => {
  const detector = createStringLiteralDetector({ minOccurrences: 3 });

  describe("Collection and Analysis", () => {
    it("should detect no duplicates when string literals are unique", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const greeting = "Hello";
const farewell = "Goodbye";
      `);

      expect(reports).toHaveLength(0);
    });

    it("should detect duplicates in variable declarations", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const msg1 = "Hello World";
const msg2 = "Hello World";
const msg3 = "Hello World";
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].type).toBe("string-literal");
      expect(reports[0].similarity).toBe(100);
      expect(reports[0].duplicates).toHaveLength(3);
      expect(reports[0].description).toContain('"Hello World"');
      expect(reports[0].description).toContain("3 times");
    });

    it("should detect duplicates in function call expressions", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
console.log("Error occurred");
console.error("Error occurred");
alert("Error occurred");
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(3);
      expect(reports[0].description).toContain('"Error occurred"');
    });

    it("should detect duplicates in return statements", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
function foo() { return "Success"; }
function bar() { return "Success"; }
function baz() { return "Success"; }
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(3);
    });

    it("should detect duplicates in binary expressions", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const a = status === "active";
const b = state === "active";
const c = mode === "active";
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(3);
    });

    it("should detect duplicates in mixed contexts", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const status = "pending";
console.log("pending");
if (state === "pending") {}
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(3);
    });

    it("should skip short strings (less than 3 characters)", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const a = "a";
const b = "a";
const c = "a";
const d = "a";
      `);

      expect(reports).toHaveLength(0);
    });

    it("should respect minOccurrences configuration", async () => {
      const detectorWith2 = createStringLiteralDetector({ minOccurrences: 2 });
      const tester = new DetectorTester(detectorWith2);
      const reports = await tester.testSingleFile(`
const msg1 = "Hello";
const msg2 = "Hello";
      `);

      expect(reports).toHaveLength(1);
    });

    it("should detect multiple different string literal duplicates", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const s1 = "Success";
const s2 = "Success";
const s3 = "Success";

const e1 = "Error";
const e2 = "Error";
const e3 = "Error";
      `);

      expect(reports).toHaveLength(2);
    });

    it("should sort reports by duplicate count descending", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const a1 = "Many";
const a2 = "Many";
const a3 = "Many";
const a4 = "Many";
const a5 = "Many";

const b1 = "Few";
const b2 = "Few";
const b3 = "Few";
      `);

      expect(reports).toHaveLength(2);
      expect(reports[0].duplicates).toHaveLength(5);
      expect(reports[1].duplicates).toHaveLength(3);
    });

    it("should handle multiple files", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.test([
        {
          path: "/test/file1.ts",
          code: 'const msg = "Hello World";',
        },
        {
          path: "/test/file2.ts",
          code: 'console.log("Hello World");',
        },
        {
          path: "/test/file3.ts",
          code: 'return "Hello World";',
        },
      ]);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(3);
      expect(reports[0].duplicates[0].location.file).toBe("/test/file1.ts");
      expect(reports[0].duplicates[1].location.file).toBe("/test/file2.ts");
      expect(reports[0].duplicates[2].location.file).toBe("/test/file3.ts");
    });

    it("should include metadata in duplicate entries", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const msg1 = "Hello";
const msg2 = "Hello";
const msg3 = "Hello";
      `);

      expect(reports).toHaveLength(1);
      const duplicate = reports[0].duplicates[0];
      expect(duplicate.metadata).toHaveProperty("value");
      expect(duplicate.metadata).toHaveProperty("context");
      expect(duplicate.metadata?.value).toBe("Hello");
      expect(duplicate.metadata?.context).toBe("variable");
    });

    it("should differentiate between variable and expression context", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const msg = "Test";
console.log("Test");
return "Test";
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates[0].metadata?.context).toBe("variable");
      expect(reports[0].duplicates[1].metadata?.context).toBe("expression");
      expect(reports[0].duplicates[2].metadata?.context).toBe("expression");
    });

    it("should generate appropriate suggestion", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const a = "constant value";
const b = "constant value";
const c = "constant value";
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].suggestion).toContain("named constant");
      expect(reports[0].suggestion).toContain('"constant value"');
    });

    it("should use default minOccurrences of 3", async () => {
      const defaultDetector = createStringLiteralDetector();
      const tester = new DetectorTester(defaultDetector);
      const reports = await tester.testSingleFile(`
const a = "Test";
const b = "Test";
      `);

      expect(reports).toHaveLength(0);
    });

    it("should handle strings with special characters", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const a = "Hello\\nWorld";
const b = "Hello\\nWorld";
const c = "Hello\\nWorld";
      `);

      expect(reports).toHaveLength(1);
    });

    it("should handle empty strings", async () => {
      const tester = new DetectorTester(detector);
      const reports = await tester.testSingleFile(`
const a = "";
const b = "";
const c = "";
const d = "";
      `);

      expect(reports).toHaveLength(0);
    });
  });
});
