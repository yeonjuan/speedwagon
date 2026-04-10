import { RuleTester } from "../../test-utils/index.js";
import { duplicateStringInterpolation } from "./duplicate-string-interpolation.js";

const tester = new RuleTester(duplicateStringInterpolation);

tester.run({
  valid: [
    { code: "const a = `Hello, ${name}!`;" },
    { code: "const a = `Hello, ${name}!`; const b = `Hi, ${name}!`;" },
    { code: "const a = `${value}`;" },
    { code: "const a = `${x}` + `${y}`;" },
    { code: "const a = `no interpolation`;" },
  ],
  invalid: [
    {
      code: "const a = `Hello, ${name}!`; const b = `Hello, ${other}!`;",
      reports: [
        {
          description: '"`Hello, ${...}!`" is duplicated 2 times',
          suggestion:
            "Extract the duplicated template into a reusable function or constant",
          occurrences: [
            { line: 1, column: 11 },
            { line: 1, column: 40 },
          ],
        },
      ],
    },
    {
      code: `
const a = \`Error: \${message}\`;
const b = \`Error: \${error.message}\`;
const c = \`Error: \${err}\`;
      `.trim(),
      reports: [
        {
          description: '"`Error: ${...}`" is duplicated 3 times',
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
const a = \`\${x} / \${y}\`;
const b = \`\${sum} / \${total}\`;
      `.trim(),
      reports: [
        {
          description: '"`${...} / ${...}`" is duplicated 2 times',
          occurrences: [
            { line: 1, column: 11 },
            { line: 2, column: 11 },
          ],
        },
      ],
    },
  ],
});
