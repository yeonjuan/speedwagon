import { RuleTester } from "../test-utils/index.js";
import { duplicateRegexLiteral } from "./duplicate-regex-literal.js";

const tester = new RuleTester(duplicateRegexLiteral);

tester.run({
  valid: [
    { code: "const a = /foo/;" },
    { code: "const a = /foo/; const b = /bar/;" },
    { code: "const a = /foo/i; const b = /foo/;" },
  ],
  invalid: [
    {
      code: "const a = /foo/; const b = /foo/;",
      reports: [
        {
          description: "RegExp `/foo/` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 11 },
            { line: 1, column: 28 },
          ],
        },
      ],
    },
    {
      code: `
const a = /\\d+/g;
const b = /\\d+/g;
const c = /\\d+/g;
      `.trim(),
      reports: [
        {
          description: "RegExp `/\\d+/g` is duplicated 3 times",
          occurrences: [
            { line: 1, column: 11 },
            { line: 2, column: 11 },
            { line: 3, column: 11 },
          ],
        },
      ],
    },
    {
      code: `
const a = /foo/;
const b = /bar/;
const c = /foo/;
const d = /bar/;
      `.trim(),
      reports: [
        {
          description: "RegExp `/foo/` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 11 },
            { line: 3, column: 11 },
          ],
        },
        {
          description: "RegExp `/bar/` is duplicated 2 times",
          occurrences: [
            { line: 2, column: 11 },
            { line: 4, column: 11 },
          ],
        },
      ],
    },
  ],
});
