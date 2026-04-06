import { describe, expect, it } from "vitest";
import { CollectorTester } from "../../test-utils/index.js";
import { createFunctionDefinitionCollector } from "./index.js";

describe("FunctionDefinitionCollector", () => {
  const collector = createFunctionDefinitionCollector({ minOccurrences: 2 });

  it("detects duplicated function declarations with different local names", async () => {
    const tester = new CollectorTester(collector);
    const reports = await tester.testSingleFile(`
function sumPrices(price, tax) {
  const total = price + tax;
  return total * 2;
}

function sumScores(score, bonus) {
  const finalValue = score + bonus;
  return finalValue * 2;
}
    `);

    expect(reports).toHaveLength(1);
    expect(reports[0].type).toBe("function-definition");
    expect(reports[0].duplicates).toHaveLength(2);
  });

  it("keeps external callee names significant", async () => {
    const tester = new CollectorTester(collector);
    const reports = await tester.testSingleFile(`
function a(value) {
  return formatPrice(value);
}

function b(value) {
  return formatScore(value);
}
    `);

    expect(reports).toHaveLength(0);
  });

  it("detects duplicated arrow functions", async () => {
    const tester = new CollectorTester(collector);
    const reports = await tester.testSingleFile(`
const mapPrice = (value) => {
  const next = value.trim();
  return next.toUpperCase();
};

const mapName = (input) => {
  const normalized = input.trim();
  return normalized.toUpperCase();
};
    `);

    expect(reports).toHaveLength(1);
    expect(reports[0].duplicates).toHaveLength(2);
  });

  it("detects duplicated object and class methods", async () => {
    const tester = new CollectorTester(collector);
    const reports = await tester.testSingleFile(`
const service = {
  format(value) {
    const result = value + 1;
    return result;
  },
};

class Formatter {
  render(input) {
    const next = input + 1;
    return next;
  }
}
    `);

    expect(reports).toHaveLength(1);
    expect(reports[0].duplicates).toHaveLength(2);
  });

  it("respects minOccurrences", async () => {
    const strictCollector = createFunctionDefinitionCollector({
      minOccurrences: 3,
    });
    const tester = new CollectorTester(strictCollector);
    const reports = await tester.testSingleFile(`
function first(a) {
  return a + 1;
}

function second(b) {
  return b + 1;
}
    `);

    expect(reports).toHaveLength(0);
  });

  it("stores metadata for duplicates", async () => {
    const tester = new CollectorTester(collector);
    const reports = await tester.testSingleFile(`
function first(a) {
  return a + 1;
}

function second(b) {
  return b + 1;
}
    `);

    expect(reports).toHaveLength(1);
    expect(reports[0].duplicates[0].metadata).toHaveProperty("normalized");
    expect(reports[0].duplicates[0].metadata).toHaveProperty("raw");
  });
});
