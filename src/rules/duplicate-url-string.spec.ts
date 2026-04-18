import { RuleTester } from "../test-utils/index.js";
import { duplicateUrlString } from "./duplicate-url-string.js";

const tester = new RuleTester(duplicateUrlString);

tester.run({
  valid: [
    { code: `const a = "https://example.com";` },
    { code: `const a = "https://example.com"; const b = "https://other.com";` },
    { code: `const a = "not-a-url";` },
    { code: "const a = `https://example.com/${id}`;" },
  ],
  invalid: [
    {
      code: `const a = "https://example.com"; const b = "https://example.com";`,
      reports: [
        {
          description: "URL `https://example.com` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 11 },
            { line: 1, column: 44 },
          ],
        },
      ],
    },
    {
      code: `
const a = "https://example.com/api";
const b = "https://example.com/api";
const c = "https://example.com/api";
      `.trim(),
      reports: [
        {
          description: "URL `https://example.com/api` is duplicated 3 times",
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
const a = \`https://example.com\`;
const b = \`https://example.com\`;
      `.trim(),
      reports: [
        {
          description: "URL `https://example.com` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 11 },
            { line: 2, column: 11 },
          ],
        },
      ],
    },
    {
      code: `
const a = "https://example.com";
const b = \`https://example.com\`;
      `.trim(),
      reports: [
        {
          description: "URL `https://example.com` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 11 },
            { line: 2, column: 11 },
          ],
        },
      ],
    },
  ],
});
