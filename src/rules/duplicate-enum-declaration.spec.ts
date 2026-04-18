import { RuleTester } from "../test-utils/index.js";
import { duplicateEnumDeclaration } from "./duplicate-enum-declaration.js";

const tester = new RuleTester(duplicateEnumDeclaration);

tester.run({
  valid: [
    { code: `enum A { X, Y, Z }` },
    { code: `enum A { X, Y } enum B { X, Y, Z }` },
    { code: `enum A { X = 1 } enum B { X = 2 }` },
  ],
  invalid: [
    {
      code: `enum A { X, Y, Z } enum B { X, Y, Z }`,
      reports: [
        {
          description: "Enum `{ X, Y, Z }` is defined in 2 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 1, column: 20 },
          ],
        },
      ],
    },
    {
      code: `enum A { Z, X, Y } enum B { X, Y, Z }`,
      reports: [
        {
          description: "Enum `{ Z, X, Y }` is defined in 2 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 1, column: 20 },
          ],
        },
      ],
    },
    {
      code: `
enum A { Up = "UP", Down = "DOWN" }
enum B { Down = "DOWN", Up = "UP" }
      `.trim(),
      reports: [
        {
          description: `Enum \`{ Up = "UP", Down = "DOWN" }\` is defined in 2 places`,
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },
    {
      code: `
enum A { Active, Inactive, Pending }
enum B { Active, Inactive, Pending }
enum C { Active, Inactive, Pending }
      `.trim(),
      reports: [
        {
          description:
            "Enum `{ Active, Inactive, Pending }` is defined in 3 places",
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
