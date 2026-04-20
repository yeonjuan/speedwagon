import { describe, it, expect } from "vitest";
import { Visitor } from "oxc-parser";
import { tsLanguage } from "../languages/index.js";
import { CollectorContext } from "./context/index.js";
import { cognitiveComplexity } from "./cognitive-complexity.js";

async function collect(code: string) {
  const collector = cognitiveComplexity;
  const program = await tsLanguage.parse(code, "test.ts");
  const context = new CollectorContext();
  const mutationApi = context.mutationApi("test.ts", code);
  const visitor = new Visitor(collector.createJSVisitor(mutationApi));
  visitor.visit(program);
  return [...context.keys()].flatMap((key) => context.getByKey(key));
}

async function getComplexity(code: string): Promise<number> {
  const results = await collect(code);
  return results.length === 0 ? 0 : parseInt(results[0].key, 10);
}

// Generate a function with N sequential ifs at nesting=0 (complexity = N)
function nIfs(n: number): string {
  const params = Array.from({ length: n }, (_, i) => `a${i}`).join(", ");
  const body = Array.from({ length: n }, (_, i) => `if (a${i}) {}`).join(" ");
  return `function f(${params}) { ${body} }`;
}

describe("cognitiveComplexity collector", () => {
  describe("id", () => {
    it("is 'cognitive-complexity'", () => {
      expect(cognitiveComplexity.id).toBe("cognitive-complexity");
    });
  });

  describe("threshold = 15", () => {
    it("does not collect functions with complexity <= 15", async () => {
      expect(await collect(nIfs(15))).toHaveLength(0);
    });

    it("collects functions with complexity > 15", async () => {
      const results = await collect(nIfs(16));
      expect(results).toHaveLength(1);
      expect(results[0].displayName).toBe("f (complexity: 16)");
    });
  });

  describe("if / else if / else", () => {
    it("each if adds 1", async () => {
      // 16 sequential ifs = complexity 16
      expect(await getComplexity(nIfs(16))).toBe(16);
    });

    it("else adds 1", async () => {
      // 15 ifs + 1 else = 16
      const code = `function f(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
        if (a0) {} if (a1) {} if (a2) {} if (a3) {} if (a4) {}
        if (a5) {} if (a6) {} if (a7) {} if (a8) {} if (a9) {}
        if (a10) {} if (a11) {} if (a12) {} if (a13) {} if (a14) {} else {}
      }`;
      expect(await getComplexity(code)).toBe(16);
    });

    it("else if adds 1", async () => {
      // 14 ifs + 1 else-if + 1 else = 16
      const code = `function f(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, x, y) {
        if (a0) {} if (a1) {} if (a2) {} if (a3) {} if (a4) {}
        if (a5) {} if (a6) {} if (a7) {} if (a8) {} if (a9) {}
        if (a10) {} if (a11) {} if (a12) {} if (a13) {} if (x) {} else if (y) {}
      }`;
      expect(await getComplexity(code)).toBe(16);
    });

    it("nested if adds nesting penalty", async () => {
      // 6 levels deep: 1+2+3+4+5+6 = 21
      const code = `function f(a, b, c, d, e, g) { if (a) { if (b) { if (c) { if (d) { if (e) { if (g) {} } } } } } }`;
      expect(await getComplexity(code)).toBe(21);
    });
  });

  describe("loops", () => {
    it("each loop adds 1", async () => {
      // 16 sequential for loops = 16
      const code = `function f() {
        for (let i = 0; i < 1; i++) {} for (let i = 0; i < 1; i++) {} for (let i = 0; i < 1; i++) {}
        for (let i = 0; i < 1; i++) {} for (let i = 0; i < 1; i++) {} for (let i = 0; i < 1; i++) {}
        for (let i = 0; i < 1; i++) {} for (let i = 0; i < 1; i++) {} for (let i = 0; i < 1; i++) {}
        for (let i = 0; i < 1; i++) {} for (let i = 0; i < 1; i++) {} for (let i = 0; i < 1; i++) {}
        for (let i = 0; i < 1; i++) {} for (let i = 0; i < 1; i++) {} for (let i = 0; i < 1; i++) {}
        for (let i = 0; i < 1; i++) {}
      }`;
      expect(await getComplexity(code)).toBe(16);
    });

    it("while adds 1", async () => {
      // 15 ifs + 1 while = 16
      const code = `function f(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, x) {
        if (a0) {} if (a1) {} if (a2) {} if (a3) {} if (a4) {}
        if (a5) {} if (a6) {} if (a7) {} if (a8) {} if (a9) {}
        if (a10) {} if (a11) {} if (a12) {} if (a13) {} if (a14) {} while (x) {}
      }`;
      expect(await getComplexity(code)).toBe(16);
    });

    it("do-while adds 1", async () => {
      // 15 ifs + 1 do-while = 16
      const code = `function f(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, x) {
        if (a0) {} if (a1) {} if (a2) {} if (a3) {} if (a4) {}
        if (a5) {} if (a6) {} if (a7) {} if (a8) {} if (a9) {}
        if (a10) {} if (a11) {} if (a12) {} if (a13) {} if (a14) {} do {} while (x);
      }`;
      expect(await getComplexity(code)).toBe(16);
    });

    it("for-of adds 1", async () => {
      // 15 ifs + 1 for-of = 16
      const code = `function f(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, arr) {
        if (a0) {} if (a1) {} if (a2) {} if (a3) {} if (a4) {}
        if (a5) {} if (a6) {} if (a7) {} if (a8) {} if (a9) {}
        if (a10) {} if (a11) {} if (a12) {} if (a13) {} if (a14) {} for (const x of arr) {}
      }`;
      expect(await getComplexity(code)).toBe(16);
    });

    it("for-in adds 1", async () => {
      // 15 ifs + 1 for-in = 16
      const code = `function f(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, obj) {
        if (a0) {} if (a1) {} if (a2) {} if (a3) {} if (a4) {}
        if (a5) {} if (a6) {} if (a7) {} if (a8) {} if (a9) {}
        if (a10) {} if (a11) {} if (a12) {} if (a13) {} if (a14) {} for (const k in obj) {}
      }`;
      expect(await getComplexity(code)).toBe(16);
    });

    it("nested loop adds nesting penalty", async () => {
      // 6 levels deep: 1+2+3+4+5+6 = 21
      const code = `function f() { for (;;) { for (;;) { for (;;) { for (;;) { for (;;) { for (;;) { break; } } } } } } }`;
      expect(await getComplexity(code)).toBe(21);
    });
  });

  describe("switch", () => {
    it("switch adds 1", async () => {
      // 15 ifs + 1 switch = 16
      const code = `function f(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, x) {
        if (a0) {} if (a1) {} if (a2) {} if (a3) {} if (a4) {}
        if (a5) {} if (a6) {} if (a7) {} if (a8) {} if (a9) {}
        if (a10) {} if (a11) {} if (a12) {} if (a13) {} if (a14) {} switch (x) { case 1: break; }
      }`;
      expect(await getComplexity(code)).toBe(16);
    });
  });

  describe("catch", () => {
    it("catch adds 1", async () => {
      // 15 ifs + 1 catch = 16
      const code = `function f(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
        if (a0) {} if (a1) {} if (a2) {} if (a3) {} if (a4) {}
        if (a5) {} if (a6) {} if (a7) {} if (a8) {} if (a9) {}
        if (a10) {} if (a11) {} if (a12) {} if (a13) {} if (a14) {} try {} catch (e) {}
      }`;
      expect(await getComplexity(code)).toBe(16);
    });
  });

  describe("ternary", () => {
    it("ternary adds 1", async () => {
      // 15 ifs + 1 ternary = 16
      const code = `function f(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, x) {
        if (a0) {} if (a1) {} if (a2) {} if (a3) {} if (a4) {}
        if (a5) {} if (a6) {} if (a7) {} if (a8) {} if (a9) {}
        if (a10) {} if (a11) {} if (a12) {} if (a13) {} if (a14) {} return x ? 1 : 2;
      }`;
      expect(await getComplexity(code)).toBe(16);
    });

    it("nested ternary adds nesting penalty", async () => {
      // 6 levels: 1+2+3+4+5+6 = 21
      const code = `function f(a, b, c, d, e, g) { return a ? (b ? (c ? (d ? (e ? (g ? 1 : 2) : 3) : 4) : 5) : 6) : 7; }`;
      expect(await getComplexity(code)).toBe(21);
    });
  });

  describe("logical operators", () => {
    it("long && chain counts as 1", async () => {
      // a0&&a1&&...&&a11 = 1 sequence → complexity 1, below threshold
      const params = Array.from({ length: 12 }, (_, i) => `a${i}`).join(", ");
      const expr = Array.from({ length: 12 }, (_, i) => `a${i}`).join(" && ");
      const results = await collect(
        `function f(${params}) { return ${expr}; }`,
      );
      expect(results).toHaveLength(0);
    });

    it("alternating && sequences joined by || count only && groups", async () => {
      // 16 (a&&b) pairs joined by ||: 16 && sequences, || is ignored = complexity 16
      const params = Array.from({ length: 32 }, (_, i) => `a${i}`).join(", ");
      const pairs = Array.from(
        { length: 16 },
        (_, i) => `a${i * 2} && a${i * 2 + 1}`,
      ).join(" || ");
      expect(
        await getComplexity(`function f(${params}) { return ${pairs}; }`),
      ).toBe(16);
    });
  });

  describe("break/continue with label", () => {
    it("break with label adds 1, break without label does not", async () => {
      const base = (breakStmt: string) => `
        function f(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
          if (a0) {} if (a1) {} if (a2) {} if (a3) {} if (a4) {}
          if (a5) {} if (a6) {} if (a7) {} if (a8) {} if (a9) {}
          if (a10) {} if (a11) {} if (a12) {} if (a13) {} if (a14) {}
          outer: for (;;) { ${breakStmt}; }
        }
      `;
      // 15 ifs + for(+1) + labeled break(+1) = 17
      expect(await getComplexity(base("break outer"))).toBe(17);
      // 15 ifs + for(+1) + plain break(+0) = 16
      expect(await getComplexity(base("break"))).toBe(16);
    });

    it("continue with label adds 1, continue without label does not", async () => {
      const base = (continueStmt: string) => `
        function f(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
          if (a0) {} if (a1) {} if (a2) {} if (a3) {} if (a4) {}
          if (a5) {} if (a6) {} if (a7) {} if (a8) {} if (a9) {}
          if (a10) {} if (a11) {} if (a12) {} if (a13) {} if (a14) {}
          outer: for (;;) { ${continueStmt}; }
        }
      `;
      expect(await getComplexity(base("continue outer"))).toBe(17);
      expect(await getComplexity(base("continue"))).toBe(16);
    });
  });

  describe("nested functions", () => {
    it("nested function starts with nesting level 0 (independent scope)", async () => {
      // inner: 6 ifs at nesting 0 → total: 6 (below threshold, not collected)
      const code = `function outer() { function inner() {
        if (a) {} if (b) {} if (c) {} if (d) {} if (e) {} if (f) {}
      } }`;
      const results = await collect(code);
      const inner = results.find((r) => r.displayName.startsWith("inner"));
      expect(inner).toBeUndefined();
    });

    it("nested function above threshold is collected independently", async () => {
      // inner: 16 ifs at nesting 0 → complexity 16
      const code = `function outer() { function inner() {
        if (a) {} if (b) {} if (c) {} if (d) {} if (e) {} if (f) {} if (g) {} if (h) {}
        if (i) {} if (j) {} if (k) {} if (l) {} if (m) {} if (n) {} if (o) {} if (p) {}
      } }`;
      const results = await collect(code);
      const inner = results.find((r) => r.displayName.startsWith("inner"));
      expect(inner?.key).toBe("16");
    });

    it("outer function is not collected when it has no complexity of its own", async () => {
      const code = `function outer() { function inner() {
        if (a) {} if (b) {} if (c) {} if (d) {} if (e) {} if (f) {}
      } }`;
      const results = await collect(code);
      const outer = results.find((r) => r.displayName.startsWith("outer"));
      expect(outer).toBeUndefined();
    });

    it("arrow function has independent nesting scope", async () => {
      // arrow: 16 ifs at nesting 0 → complexity 16
      const code = `function f() { const g = () => {
        if (a) {} if (b) {} if (c) {} if (d) {} if (e) {} if (x) {} if (h) {} if (i) {}
        if (j) {} if (k) {} if (l) {} if (m) {} if (n) {} if (o) {} if (p) {} if (q) {}
      }; }`;
      const results = await collect(code);
      const g = results.find((r) => r.displayName.startsWith("<anonymous>"));
      expect(g?.key).toBe("16");
    });
  });

  describe("displayName and location", () => {
    it("includes function name and complexity", async () => {
      const results = await collect(nIfs(16));
      expect(results[0].displayName).toBe("f (complexity: 16)");
    });

    it("reports correct start line", async () => {
      const results = await collect(`\n${nIfs(16)}`);
      expect(results[0].location.start.line).toBe(2);
    });
  });
});
