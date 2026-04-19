import { RuleTester } from "../test-utils/index.js";
import { cognitiveComplexFunction } from "./cognitive-complex-function.js";

const tester = new RuleTester(cognitiveComplexFunction);

// Helper: generate a function with N sequential ifs (complexity = N)
function nIfs(n: number): string {
  const params = Array.from({ length: n }, (_, i) => `a${i}`).join(",");
  const body = Array.from({ length: n }, (_, i) => `if(a${i}){}`).join("");
  return `function f(${params}){${body}}`;
}

tester.run({
  valid: [
    // complexity 1 — below threshold
    { code: "function f(a){ if(a){} }" },
    // complexity 10 — at threshold (not reported)
    { code: nIfs(10) },
    // no functions
    { code: "const x = 1;" },
  ],
  invalid: [
    {
      // complexity 11 — just above threshold
      code: nIfs(11),
      reports: [
        {
          description: "f has a cognitive complexity of 11 (threshold: 10)",
          occurrences: [{ line: 1, column: 1 }],
        },
      ],
    },
    {
      // 5-level nesting: 1+2+3+4+5 = 15
      code: "function f(a,b,c,d,e){if(a){if(b){if(c){if(d){if(e){}}}}}}",
      reports: [
        {
          description: "f has a cognitive complexity of 15 (threshold: 10)",
          occurrences: [{ line: 1, column: 1 }],
        },
      ],
    },
    {
      // two functions, both above threshold
      code: `${nIfs(11)}\n${nIfs(11).replace("function f(", "function g(")}`,
      reports: [
        {
          description: "f has a cognitive complexity of 11 (threshold: 10)",
        },
        {
          description: "g has a cognitive complexity of 11 (threshold: 10)",
        },
      ],
    },
  ],
});
