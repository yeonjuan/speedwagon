import { describe, it, expect } from "vitest";
import { createLogicalExpressionCollector } from "./index.js";
import { CollectorTester } from "../../test-utils/index.js";

const TYPE_LITERAL = "Literal";
const TYPE_STRING = "string";

describe("LogicalExpressionCollector", () => {
  const collector = createLogicalExpressionCollector({
    minOccurrences: 2,
    minOperands: 2,
  });

  describe("Collection and Analysis", () => {
    it("should detect identical structure with different variable names", async () => {
      const tester = new CollectorTester(collector);
      const reports = await tester.testSingleFile(`
        if (node.left.type === "Literal" && typeof node.left.value === "string") {}
        if (node.right.type === "Literal" && typeof node.right.value === "string") {}
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(2);
      expect(reports[0].type).toBe("logical-expression");
    });

    it("should not falsely match if structures differ", async () => {
      const tester = new CollectorTester(collector);
      const reports = await tester.testSingleFile(`
        if (node.left.type === "Literal" && typeof node.left.value === "string") {}
        if (node.type === "Literal" && typeof node.right.value === "string") {}
      `);

      expect(reports).toHaveLength(0);
    });

    it("should not match if literals differ", async () => {
      const tester = new CollectorTester(collector);
      const reports = await tester.testSingleFile(`
        if (node.left.type === "Literal" && typeof node.left.value === "string") {}
        if (node.right.type === "Literal" && typeof node.right.value === "number") {}
      `);

      // Differing "string" vs "number"
      expect(reports).toHaveLength(0);
    });

    it("should handle extracted constants natively when checking for structure", async () => {
      const tester = new CollectorTester(collector);
      const reports = await tester.testSingleFile(`
        const TYPE_LITERAL = "Literal";
        const TYPE_STRING = "string";
        if (node.left.type === TYPE_LITERAL && typeof node.left.value === TYPE_STRING) {}
        if (node.right.type === TYPE_LITERAL && typeof node.right.value === TYPE_STRING) {}
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(2);
    });

    it("should extract correctly if arguments are standalone identifiers", async () => {
      const tester = new CollectorTester(collector);
      const reports = await tester.testSingleFile(`
        function test(a, b, c, d) {
          if (a === 1 && b === 2) {}
          if (c === 1 && d === 2) {}
        }
      `);

      expect(reports).toHaveLength(1);
      expect(reports[0].duplicates).toHaveLength(2);
    });

    it("should respect minOperands configuration", async () => {
      const minOpCollector = createLogicalExpressionCollector({
        minOccurrences: 2,
        minOperands: 3,
      });
      const tester = new CollectorTester(minOpCollector);
      const reports = await tester.testSingleFile(`
        if (node.left.type === "Literal" && typeof node.left.value === "string") {}
        if (node.right.type === "Literal" && typeof node.right.value === "string") {}
      `);

      expect(reports).toHaveLength(0); // Because they only have 2 operands
    });
  });
});
