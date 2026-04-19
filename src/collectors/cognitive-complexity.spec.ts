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
  const params = Array.from({ length: n }, (_, i) => `a${i}`).join(",");
  const body = Array.from({ length: n }, (_, i) => `if(a${i}){}`).join("");
  return `function f(${params}){${body}}`;
}

describe("cognitiveComplexity collector", () => {
  describe("id", () => {
    it("is 'cognitive-complexity'", () => {
      expect(cognitiveComplexity.id).toBe("cognitive-complexity");
    });
  });

  describe("threshold = 10", () => {
    it("does not collect functions with complexity <= 10", async () => {
      expect(await collect(nIfs(10))).toHaveLength(0);
    });

    it("collects functions with complexity > 10", async () => {
      const results = await collect(nIfs(11));
      expect(results).toHaveLength(1);
      expect(results[0].displayName).toBe("f (complexity: 11)");
    });
  });

  describe("if / else if / else", () => {
    it("each if adds 1", async () => {
      // 11 sequential ifs = complexity 11
      expect(await getComplexity(nIfs(11))).toBe(11);
    });

    it("else adds 1", async () => {
      // 10 ifs + 1 else = 11
      const code = `function f(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9){
        if(a0){}if(a1){}if(a2){}if(a3){}if(a4){}
        if(a5){}if(a6){}if(a7){}if(a8){}if(a9){}else{}
      }`;
      expect(await getComplexity(code)).toBe(11);
    });

    it("else if adds 1", async () => {
      // 9 ifs + 1 else-if + 1 else = 11
      const code = `function f(a0,a1,a2,a3,a4,a5,a6,a7,a8,x,y){
        if(a0){}if(a1){}if(a2){}if(a3){}if(a4){}
        if(a5){}if(a6){}if(a7){}if(a8){}if(x){}else if(y){}
      }`;
      expect(await getComplexity(code)).toBe(11);
    });

    it("nested if adds nesting penalty", async () => {
      // 5 levels deep: 1+2+3+4+5 = 15
      const code = `function f(a,b,c,d,e){if(a){if(b){if(c){if(d){if(e){}}}}}}`;
      expect(await getComplexity(code)).toBe(15);
    });
  });

  describe("loops", () => {
    it("each loop adds 1", async () => {
      // 11 sequential for loops = 11
      const code = `function f(){
        for(let i=0;i<1;i++){}for(let i=0;i<1;i++){}for(let i=0;i<1;i++){}
        for(let i=0;i<1;i++){}for(let i=0;i<1;i++){}for(let i=0;i<1;i++){}
        for(let i=0;i<1;i++){}for(let i=0;i<1;i++){}for(let i=0;i<1;i++){}
        for(let i=0;i<1;i++){}for(let i=0;i<1;i++){}
      }`;
      expect(await getComplexity(code)).toBe(11);
    });

    it("while adds 1", async () => {
      // 10 ifs + 1 while = 11
      const code = `function f(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,x){
        if(a0){}if(a1){}if(a2){}if(a3){}if(a4){}
        if(a5){}if(a6){}if(a7){}if(a8){}if(a9){}while(x){}
      }`;
      expect(await getComplexity(code)).toBe(11);
    });

    it("do-while adds 1", async () => {
      // 10 ifs + 1 do-while = 11
      const code = `function f(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,x){
        if(a0){}if(a1){}if(a2){}if(a3){}if(a4){}
        if(a5){}if(a6){}if(a7){}if(a8){}if(a9){}do{}while(x);
      }`;
      expect(await getComplexity(code)).toBe(11);
    });

    it("for-of adds 1", async () => {
      // 10 ifs + 1 for-of = 11
      const code = `function f(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,arr){
        if(a0){}if(a1){}if(a2){}if(a3){}if(a4){}
        if(a5){}if(a6){}if(a7){}if(a8){}if(a9){}for(const x of arr){}
      }`;
      expect(await getComplexity(code)).toBe(11);
    });

    it("for-in adds 1", async () => {
      // 10 ifs + 1 for-in = 11
      const code = `function f(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,obj){
        if(a0){}if(a1){}if(a2){}if(a3){}if(a4){}
        if(a5){}if(a6){}if(a7){}if(a8){}if(a9){}for(const k in obj){}
      }`;
      expect(await getComplexity(code)).toBe(11);
    });

    it("nested loop adds nesting penalty", async () => {
      // 5 levels deep: 1+2+3+4+5 = 15
      const code = `function f(){for(;;){for(;;){for(;;){for(;;){for(;;){break;}}}}}}`;
      expect(await getComplexity(code)).toBe(15);
    });
  });

  describe("switch", () => {
    it("switch adds 1", async () => {
      // 10 ifs + 1 switch = 11
      const code = `function f(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,x){
        if(a0){}if(a1){}if(a2){}if(a3){}if(a4){}
        if(a5){}if(a6){}if(a7){}if(a8){}if(a9){}switch(x){case 1:break;}
      }`;
      expect(await getComplexity(code)).toBe(11);
    });
  });

  describe("catch", () => {
    it("catch adds 1", async () => {
      // 10 ifs + 1 catch = 11
      const code = `function f(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9){
        if(a0){}if(a1){}if(a2){}if(a3){}if(a4){}
        if(a5){}if(a6){}if(a7){}if(a8){}if(a9){}try{}catch(e){}
      }`;
      expect(await getComplexity(code)).toBe(11);
    });
  });

  describe("ternary", () => {
    it("ternary adds 1", async () => {
      // 10 ifs + 1 ternary = 11
      const code = `function f(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,x){
        if(a0){}if(a1){}if(a2){}if(a3){}if(a4){}
        if(a5){}if(a6){}if(a7){}if(a8){}if(a9){}return x?1:2;
      }`;
      expect(await getComplexity(code)).toBe(11);
    });

    it("nested ternary adds nesting penalty", async () => {
      // 5 levels: 1+2+3+4+5 = 15
      const code = `function f(a,b,c,d,e){return a?(b?(c?(d?(e?1:2):3):4):5):6;}`;
      expect(await getComplexity(code)).toBe(15);
    });
  });

  describe("logical operators", () => {
    it("const x = a || literal is excluded (default value pattern)", async () => {
      // These should have 0 complexity - the || is a default value, not control flow
      const results = await collect(
        nIfs(11).replace("{", "{ const x = a || null;"),
      );
      // 11 ifs = 11, but the || is excluded
      expect(
        await getComplexity(nIfs(11).replace("{", "{ const x = a || null;")),
      ).toBe(11);
      // Without the pattern, a plain || in a return would add 1
      const withReturn = nIfs(11).replace("{", "{ return a || null;");
      expect(await getComplexity(withReturn)).toBe(12);
      void results;
    });

    it("const x = a ?? literal is excluded (default value pattern)", async () => {
      expect(
        await getComplexity(nIfs(11).replace("{", "{ const x = a ?? null;")),
      ).toBe(11);
    });

    it("a = a || literal is excluded (self-assignment default)", async () => {
      expect(
        await getComplexity(nIfs(11).replace("{", "{ a = a || null;")),
      ).toBe(11);
    });

    it("a = b || literal is NOT excluded (different left-hand sides)", async () => {
      expect(
        await getComplexity(nIfs(11).replace("{", "{ a = b || null;")),
      ).toBe(12);
    });

    it("long same-operator chain counts as 1 sequence", async () => {
      // a0&&a1&&...&&a11 = 1 sequence (complexity 1, not collected)
      const params = Array.from({ length: 12 }, (_, i) => `a${i}`).join(",");
      const expr = Array.from({ length: 12 }, (_, i) => `a${i}`).join("&&");
      const results = await collect(`function f(${params}){return ${expr};}`);
      expect(results).toHaveLength(0);
    });

    it("alternating && and || count as separate sequences", async () => {
      // 11 (a&&b) pairs joined by ||: 11 && sequences + 1 || = 12
      const params = Array.from({ length: 22 }, (_, i) => `a${i}`).join(",");
      const pairs = Array.from(
        { length: 11 },
        (_, i) => `a${i * 2}&&a${i * 2 + 1}`,
      ).join("||");
      expect(
        await getComplexity(`function f(${params}){return ${pairs};}`),
      ).toBe(12);
    });
  });

  describe("break/continue with label", () => {
    it("break with label adds 1, break without label does not", async () => {
      const base = (breakStmt: string) => `
        function f(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9){
          if(a0){}if(a1){}if(a2){}if(a3){}if(a4){}
          if(a5){}if(a6){}if(a7){}if(a8){}if(a9){}
          outer: for(;;){ ${breakStmt}; }
        }
      `;
      // 10 ifs + for(+1) + labeled break(+1) = 12
      expect(await getComplexity(base("break outer"))).toBe(12);
      // 10 ifs + for(+1) + plain break(+0) = 11
      expect(await getComplexity(base("break"))).toBe(11);
    });

    it("continue with label adds 1, continue without label does not", async () => {
      const base = (continueStmt: string) => `
        function f(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9){
          if(a0){}if(a1){}if(a2){}if(a3){}if(a4){}
          if(a5){}if(a6){}if(a7){}if(a8){}if(a9){}
          outer: for(;;){ ${continueStmt}; }
        }
      `;
      expect(await getComplexity(base("continue outer"))).toBe(12);
      expect(await getComplexity(base("continue"))).toBe(11);
    });
  });

  describe("nested functions", () => {
    it("nested function starts with nesting level 1", async () => {
      // inner: 6 ifs at base nesting 1 → each if: 1+1=2, total: 6*2=12
      const code = `function outer(){function inner(){
        if(a){}if(b){}if(c){}if(d){}if(e){}if(f){}
      }}`;
      const results = await collect(code);
      const inner = results.find((r) => r.displayName.startsWith("inner"));
      expect(inner?.key).toBe("12");
    });

    it("outer function is not collected when it has no complexity of its own", async () => {
      const code = `function outer(){function inner(){
        if(a){}if(b){}if(c){}if(d){}if(e){}if(f){}
      }}`;
      const results = await collect(code);
      const outer = results.find((r) => r.displayName.startsWith("outer"));
      expect(outer).toBeUndefined();
    });

    it("arrow function adds 1 to nesting level", async () => {
      // arrow: 6 ifs at base nesting 1 → 6*2=12
      const code = `function f(){const g=()=>{if(a){}if(b){}if(c){}if(d){}if(e){}if(x){}}}`;
      const results = await collect(code);
      const g = results.find((r) => r.displayName.startsWith("<anonymous>"));
      expect(g?.key).toBe("12");
    });
  });

  describe("displayName and location", () => {
    it("includes function name and complexity", async () => {
      const results = await collect(nIfs(11));
      expect(results[0].displayName).toBe("f (complexity: 11)");
    });

    it("reports correct start line", async () => {
      const results = await collect(`\n${nIfs(11)}`);
      expect(results[0].location.start.line).toBe(2);
    });
  });
});
