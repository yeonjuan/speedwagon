import { RuleTester } from "../test-utils/index.js";
import { cognitiveComplexFunction } from "./cognitive-complex-function.js";

const tester = new RuleTester(cognitiveComplexFunction);

// Helper: generate a function with N sequential ifs (complexity = N)
function nIfs(n: number): string {
  const params = Array.from({ length: n }, (_, i) => `a${i}`).join(", ");
  const body = Array.from({ length: n }, (_, i) => `if (a${i}) {}`).join(" ");
  return `function f(${params}) { ${body} }`;
}

tester.run({
  valid: [
    // complexity 1 — below threshold
    { code: "function f(a) { if (a) {} }" },
    // complexity 15 — at threshold (not reported)
    { code: nIfs(15) },
    // no functions
    { code: "const x = 1;" },
  ],
  invalid: [
    {
      // complexity 16 — just above threshold
      code: nIfs(16),
      reports: [
        {
          description: "f has a cognitive complexity of 16 (threshold: 15)",
          occurrences: [{ line: 1, column: 1 }],
        },
      ],
    },
    {
      // 6-level nesting: 1+2+3+4+5+6 = 21
      code: "function f(a, b, c, d, e, g) { if (a) { if (b) { if (c) { if (d) { if (e) { if (g) {} } } } } } }",
      reports: [
        {
          description: "f has a cognitive complexity of 21 (threshold: 15)",
          occurrences: [{ line: 1, column: 1 }],
        },
      ],
    },
    {
      // two functions, both above threshold
      code: `${nIfs(16)}\n${nIfs(16).replace("function f(", "function g(")}`,
      reports: [
        {
          description: "f has a cognitive complexity of 16 (threshold: 15)",
        },
        {
          description: "g has a cognitive complexity of 16 (threshold: 15)",
        },
      ],
    },
  ],
});
