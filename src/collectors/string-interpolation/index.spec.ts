import { describe, it, expect } from "vitest";
import { createStringInterpolationCollector } from "./index.js";
import { CollectorTester } from "../../test-utils/index.js";

describe("StringInterpolationCollector", () => {
  const collector = createStringInterpolationCollector({ minOccurrences: 2 });

  describe("Collection and Analysis", () => {
    it("should detect identical format strings", async () => {
      const tester = new CollectorTester(collector);
      const reports = await tester.testSingleFile(`
        const a = \`\${name}:\${age}\`;
        const b = \`\${user.name}:\${user.age}\`;
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(2);
      expect(reports[0].type).toBe("string-interpolation");
    });

    it("should ignore simple concatenations without formatting", async () => {
      const tester = new CollectorTester(collector);
      const reports = await tester.testSingleFile(`
        const a = \`\${name}\${postfix}\`;
        const b = \`\${foo}\${bar}\`;
      `);

      expect(reports).toHaveLength(0);
    });

    it("should ignore concatenations with simple spaces", async () => {
      const tester = new CollectorTester(collector);
      const reports = await tester.testSingleFile(`
        const a = \`\${name} \${postfix}\`;
        const b = \`\${foo} \${bar}\`;
      `);

      expect(reports).toHaveLength(0);
    });

    it("should ignore single expressions without any literals", async () => {
      const tester = new CollectorTester(collector);
      const reports = await tester.testSingleFile(`
        const a = \`\${num}\`;
        const b = \`\${otherNum}\`;
      `);

      expect(reports).toHaveLength(0);
    });
  });
});
