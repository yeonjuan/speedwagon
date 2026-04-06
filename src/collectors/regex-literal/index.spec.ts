import { describe, it, expect } from "vitest";
import { CollectorTester } from "../../test-utils/index.js";
import { createRegexLiteralCollector } from "./index.js";

describe("Regex Literal Collector", () => {
  it("should detect duplicated regex literals", async () => {
    const collector = createRegexLiteralCollector({ minOccurrences: 2 });
    const tester = new CollectorTester(collector);

    const report = await tester.testSingleFile(`
      const emailRegex1 = /^[a-z]+@[a-z]+\\.[a-z]+$/ig;
      
      function validateEmail(email: string) {
        return /^[a-z]+@[a-z]+\\.[a-z]+$/ig.test(email);
      }
    `);

    expect(report.length).toBe(1);
    expect(report[0].duplicates.length).toBe(2);
    expect(report[0].type).toBe("regex-literal");
    expect(report[0].suggestion).toContain(
      "Extract /^[a-z]+@[a-z]+\\.[a-z]+$/gi",
    );
  });

  it("should not report unique regex literals", async () => {
    const collector = createRegexLiteralCollector({ minOccurrences: 2 });
    const tester = new CollectorTester(collector);

    const report = await tester.testSingleFile(`
      const r1 = /a/;
      const r2 = /b/;
    `);

    expect(report.length).toBe(0);
  });
});
