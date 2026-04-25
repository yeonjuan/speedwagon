import { RuleTester } from "../test-utils/index.js";
import { duplicateMagicNumbers } from "./duplicate-magic-numbers.js";

const tester = new RuleTester(duplicateMagicNumbers);

tester.run({
  valid: [
    { code: "const a = 42;" },
    { code: "const a = 42; const b = 43;" },
    { code: "const a = 0; const b = 0;" },
    { code: "const a = 1; const b = 1; const c = 1;" },
    { code: "const a = -1; const b = -1;" },
  ],
  invalid: [
    {
      code: "const a = 42; const b = 42;",
      reports: [
        {
          description: "Magic number `42` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 11 },
            { line: 1, column: 25 },
          ],
        },
      ],
    },
    {
      code: `
const delay1 = 1000;
const delay2 = 1000;
const delay3 = 1000;
      `.trim(),
      reports: [
        {
          description: "Magic number `1000` is duplicated 3 times",
          occurrences: [
            { line: 1, column: 16 },
            { line: 2, column: 16 },
            { line: 3, column: 16 },
          ],
        },
      ],
    },
  ],
});
