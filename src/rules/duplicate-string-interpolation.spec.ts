import { RuleTester } from "../test-utils/index.js";
import { duplicateStringInterpolation } from "./duplicate-string-interpolation.js";

const tester = new RuleTester(duplicateStringInterpolation);

tester.run({
  valid: [
    { code: "const a = `hello ${foo}`;" },
    { code: "const a = `hello ${foo}`; const b = `world ${foo}`;" },
    { code: "const a = `${foo}`;" },
    { code: "const a = `${foo}`; const b = `${bar}`;" },
    { code: "const a = `hello`;" },
  ],
  invalid: [
    {
      code: "const a = `hello ${foo}`; const b = `hello ${bar}`;",
      reports: [
        {
          description: "`hello ${foo}` is used in 2 places",
          occurrences: [
            { line: 1, column: 11 },
            { line: 1, column: 37 },
          ],
        },
      ],
    },
    {
      code: "const a = `hello ${foo}`; const b = `hello ${foo.bar}`;",
      reports: [
        {
          description: "`hello ${foo}` is used in 2 places",
          occurrences: [
            { line: 1, column: 11 },
            { line: 1, column: 37 },
          ],
        },
      ],
    },
    {
      code: `
const a = \`Hello, \${name}!\`;
const b = \`Hello, \${user.name}!\`;
      `.trim(),
      reports: [
        {
          description: "`Hello, ${name}!` is used in 2 places",
          occurrences: [
            { line: 1, column: 11 },
            { line: 2, column: 11 },
          ],
        },
      ],
    },
    {
      code: `
const a = \`/api/\${version}/users\`;
const b = \`/api/\${version}/users\`;
const c = \`/api/\${ver}/users\`;
      `.trim(),
      reports: [
        {
          description: "`/api/${version}/users` is used in 3 places",
          occurrences: [
            { line: 1, column: 11 },
            { line: 2, column: 11 },
            { line: 3, column: 11 },
          ],
        },
      ],
    },
  ],
});
