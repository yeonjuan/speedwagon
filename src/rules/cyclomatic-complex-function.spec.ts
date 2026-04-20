import { RuleTester } from "../test-utils/index.js";
import { cyclomaticComplexFunction } from "./cyclomatic-complex-function.js";

const tester = new RuleTester(cyclomaticComplexFunction);

function nIfs(n: number): string {
  const params = Array.from({ length: n }, (_, i) => `a${i}`).join(", ");
  const body = Array.from({ length: n }, (_, i) => `if (a${i}) {}`).join(" ");
  return `function f(${params}) { ${body} }`;
}

tester.run({
  valid: [
    { code: "function f(a) { if (a) {} }" },
    { code: nIfs(14) },
    { code: "const x = 1;" },
  ],
  invalid: [
    {
      // base(1) + 15 ifs = 16
      code: nIfs(15),
      reports: [
        {
          description: "f has a cyclomatic complexity of 16 (threshold: 15)",
          occurrences: [{ line: 1, column: 1 }],
        },
      ],
    },
    {
      // two functions, both above threshold
      code: `${nIfs(15)}\n${nIfs(15).replace("function f(", "function g(")}`,
      reports: [
        {
          description: "f has a cyclomatic complexity of 16 (threshold: 15)",
        },
        {
          description: "g has a cyclomatic complexity of 16 (threshold: 15)",
        },
      ],
    },
  ],
});
