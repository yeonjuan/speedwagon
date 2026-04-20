import { describe, it, expect } from "vitest";
import { Visitor } from "oxc-parser";
import { tsLanguage } from "../languages/index.js";
import { CollectorContext } from "./context/index.js";
import { cyclomaticComplexity } from "./cyclomatic-complexity.js";

async function collect(code: string) {
  const program = await tsLanguage.parse(code, "test.ts");
  const context = new CollectorContext();
  const mutationApi = context.mutationApi("test.ts", code);
  const visitor = new Visitor(
    cyclomaticComplexity.createJSVisitor(mutationApi),
  );
  visitor.visit(program);
  return [...context.keys()].flatMap((key) => context.getByKey(key));
}

async function getComplexity(code: string): Promise<number> {
  const results = await collect(code);
  return results.length === 0 ? 0 : parseInt(results[0].key, 10);
}

// Generates code padded with `n` ifs so that base(1) + n = n+1.
// Adding one more decision point puts it just above threshold(15).
function withPad(n: number, extra: string, extraParams = ""): string {
  const padParams = Array.from({ length: n }, (_, i) => `p${i}`).join(", ");
  const padBody = Array.from({ length: n }, (_, i) => `if (p${i}) {}`).join(
    " ",
  );
  const params = [padParams, extraParams].filter(Boolean).join(", ");
  return `function f(${params}) { ${padBody} ${extra} }`;
}

describe("cyclomaticComplexity collector", () => {
  describe("id", () => {
    it("is 'cyclomatic-complexity'", () => {
      expect(cyclomaticComplexity.id).toBe("cyclomatic-complexity");
    });
  });

  describe("threshold = 15", () => {
    it("does not collect functions with complexity <= 15", async () => {
      // base(1) + 14 ifs = 15
      expect(await collect(withPad(14, ""))).toHaveLength(0);
    });

    it("collects functions with complexity > 15", async () => {
      // base(1) + 15 ifs = 16
      const results = await collect(withPad(15, ""));
      expect(results).toHaveLength(1);
      expect(results[0].displayName).toBe("f (complexity: 16)");
    });
  });

  describe("if / else if / else", () => {
    it("if adds 1", async () => {
      // base(1) + 14 pad + if(1) = 16
      expect(await getComplexity(withPad(14, "if (x) {}", "x"))).toBe(16);
    });

    it("else if adds 1 per branch", async () => {
      // base(1) + 13 pad + if(1) + else-if(1) = 16
      expect(
        await getComplexity(withPad(13, "if (x) {} else if (y) {}", "x, y")),
      ).toBe(16);
    });

    it("else does not add complexity", async () => {
      // base(1) + 14 pad + if(1) + else(0) = 16, not 17
      expect(await getComplexity(withPad(14, "if (x) {} else {}", "x"))).toBe(
        16,
      );
    });
  });

  describe("loops", () => {
    it("for adds 1", async () => {
      expect(
        await getComplexity(withPad(14, "for (let i = 0; i < 1; i++) {}")),
      ).toBe(16);
    });

    it("while adds 1", async () => {
      expect(await getComplexity(withPad(14, "while (x) {}", "x"))).toBe(16);
    });

    it("do-while adds 1", async () => {
      expect(await getComplexity(withPad(14, "do {} while (x);", "x"))).toBe(
        16,
      );
    });

    it("for-of adds 1", async () => {
      expect(
        await getComplexity(withPad(14, "for (const x of arr) {}", "arr")),
      ).toBe(16);
    });

    it("for-in adds 1", async () => {
      expect(
        await getComplexity(withPad(14, "for (const k in obj) {}", "obj")),
      ).toBe(16);
    });
  });

  describe("switch", () => {
    it("each non-default case adds 1", async () => {
      // base(1) + 13 pad + case1(1) + case2(1) = 16
      const code = withPad(
        13,
        "switch (x) { case 1: break; case 2: break; default: break; }",
        "x",
      );
      expect(await getComplexity(code)).toBe(16);
    });

    it("default does not add complexity", async () => {
      // base(1) + 14 pad + case1(1) = 16, default adds 0
      const code = withPad(
        14,
        "switch (x) { case 1: break; default: break; }",
        "x",
      );
      expect(await getComplexity(code)).toBe(16);
    });
  });

  describe("catch", () => {
    it("catch adds 1", async () => {
      expect(await getComplexity(withPad(14, "try {} catch (e) {}"))).toBe(16);
    });
  });

  describe("ternary", () => {
    it("ternary adds 1", async () => {
      expect(await getComplexity(withPad(14, "return x ? 1 : 2;", "x"))).toBe(
        16,
      );
    });
  });

  describe("logical operators", () => {
    it("&& adds 1 per occurrence", async () => {
      expect(await getComplexity(withPad(14, "return a && b;", "a, b"))).toBe(
        16,
      );
    });

    it("|| adds 1 per occurrence", async () => {
      expect(await getComplexity(withPad(14, "return a || b;", "a, b"))).toBe(
        16,
      );
    });

    it("?? adds 1 per occurrence", async () => {
      expect(await getComplexity(withPad(14, "return a ?? null;", "a"))).toBe(
        16,
      );
    });

    it("each operator in a chain adds 1 independently", async () => {
      // base(1) + 13 pad + &&(1) + &&(1) = 16
      expect(
        await getComplexity(withPad(13, "return a && b && c;", "a, b, c")),
      ).toBe(16);
    });
  });

  describe("nesting does not affect complexity", () => {
    it("if inside for adds exactly 1 (no nesting penalty)", async () => {
      // base(1) + 13 pad + for(1) + if(1) = 16
      const code = withPad(13, "for (;;) { if (x) {} break; }", "x");
      expect(await getComplexity(code)).toBe(16);
    });
  });

  describe("nested functions", () => {
    it("each function has its own independent complexity", async () => {
      // outer: base(1) only → not collected
      // inner: base(1) + 14 ifs = 15 → not collected (≤ threshold)
      const innerParams = Array.from({ length: 14 }, (_, i) => `a${i}`).join(
        ", ",
      );
      const innerBody = Array.from(
        { length: 14 },
        (_, i) => `if (a${i}) {}`,
      ).join(" ");
      const code = `function outer() { function inner(${innerParams}) { ${innerBody} } }`;
      const results = await collect(code);
      expect(results).toHaveLength(0);
    });
  });

  describe("displayName and location", () => {
    it("includes function name and complexity", async () => {
      const results = await collect(withPad(15, ""));
      expect(results[0].displayName).toBe("f (complexity: 16)");
    });

    it("reports correct start line", async () => {
      const results = await collect(`\n${withPad(15, "")}`);
      expect(results[0].location.start.line).toBe(2);
    });
  });
});
