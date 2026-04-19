import { RuleTester } from "../test-utils/index.js";
import { duplicateTypeDeclaration } from "./duplicate-type-declaration.js";

const tester = new RuleTester(duplicateTypeDeclaration);

tester.run({
  valid: [
    { code: `type A = string;` },
    { code: `type A = string; type B = number;` },
    { code: `type A = { x: number }; type B = { x: string };` },
  ],
  invalid: [
    {
      code: `type A = string | number; type B = string | number;`,
      reports: [
        {
          description: "`A` is defined in 2 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 1, column: 27 },
          ],
        },
      ],
    },
    {
      code: `type A = number | string; type B = string | number;`,
      reports: [
        {
          description: "`A` is defined in 2 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 1, column: 27 },
          ],
        },
      ],
    },
    {
      code: `
type A = { id: number; name: string };
type B = { id: number; name: string };
      `.trim(),
      reports: [
        {
          description: "`A` is defined in 2 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },
    {
      code: `
type A = "pending" | "approved" | "rejected";
type B = "approved" | "rejected" | "pending";
type C = "rejected" | "pending" | "approved";
      `.trim(),
      reports: [
        {
          description: "`A` is defined in 3 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
            { line: 3, column: 1 },
          ],
        },
      ],
    },
  ],
});
