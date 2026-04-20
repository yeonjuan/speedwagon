import { RuleTester } from "../test-utils/index.js";
import { duplicateUrlString } from "./duplicate-url-string.js";

const tester = new RuleTester(duplicateUrlString);

tester.run({
  valid: [
    { code: `const a = "https://example.com";` },
    { code: `const a = "https://example.com"; const b = "https://other.com";` },
    { code: `const a = "not-a-url";` },
    { code: "const a = `https://example.com/${id}`;" },
    // svg xmlns attribute should be ignored
    {
      code: `const a = <svg xmlns="http://www.w3.org/2000/svg"><path /></svg>;`,
      filename: "test.tsx",
    },
    // only svg xmlns is ignored — same url elsewhere is still collected (but only 1 occurrence → valid)
    {
      code: `const a = <svg xmlns="http://www.w3.org/2000/svg" />; const b = "http://www.w3.org/2000/svg";`,
      filename: "test.tsx",
    },
    // xmlns on non-svg element is NOT ignored, but single occurrence is valid
    {
      code: `const a = <div xmlns="https://example.com" />;`,
      filename: "test.tsx",
    },
    // nested JSX: svg xmlns inside another element's prop is still ignored
    {
      code: `const a = <Foo icon={<svg xmlns="http://www.w3.org/2000/svg" />} />;`,
      filename: "test.tsx",
    },
  ],
  invalid: [
    // xmlns on non-svg element IS collected
    {
      code: `
const a = <div xmlns="https://example.com" />;
const b = <div xmlns="https://example.com" />;
      `.trim(),
      filename: "test.tsx",
      reports: [
        {
          description: "URL `https://example.com` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 22 },
            { line: 2, column: 22 },
          ],
        },
      ],
    },
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
