import { RuleTester } from "../test-utils/index.js";
import { duplicateInterfaceDeclaration } from "./duplicate-interface-declaration.js";

const tester = new RuleTester(duplicateInterfaceDeclaration);

tester.run({
  valid: [
    { code: `interface A { x: number }` },
    { code: `interface A { x: number } interface B { x: string }` },
    { code: `interface A { x: number } interface B { y: number }` },
    { code: `interface A {}` },
    { code: `interface A {} interface B {}` },
    {
      code: `interface A extends Base { x: number } interface B extends Other { x: number }`,
    },
    { code: `interface A { x: number } interface B { x?: number }` },
  ],
  invalid: [
    {
      code: `interface A { x: number; y: string } interface B { x: number; y: string }`,
      reports: [
        {
          description: "'A' interface is defined identically in 2 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 1, column: 38 },
          ],
        },
      ],
    },
    {
      code: `interface A { y: string; x: number } interface B { x: number; y: string }`,
      reports: [
        {
          description: "'A' interface is defined identically in 2 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 1, column: 38 },
          ],
        },
      ],
    },
    {
      code: `
interface A { id: number; name: string }
interface B { id: number; name: string }
      `.trim(),
      reports: [
        {
          description: "'A' interface is defined identically in 2 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },
    {
      code: `
interface A { id: number; name: string }
interface B { id: number; name: string }
interface C { id: number; name: string }
      `.trim(),
      reports: [
        {
          description: "'A' interface is defined identically in 3 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
            { line: 3, column: 1 },
          ],
        },
      ],
    },
    {
      code: `
interface A extends Base { x: number }
interface B extends Base { x: number }
      `.trim(),
      reports: [
        {
          description: "'A' interface is defined identically in 2 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },
    {
      code: `
interface A { onClick(): void; label: string }
interface B { label: string; onClick(): void }
      `.trim(),
      reports: [
        {
          description: "'A' interface is defined identically in 2 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },
    {
      code: `
interface A { x?: number }
interface B { x?: number }
      `.trim(),
      reports: [
        {
          description: "'A' interface is defined identically in 2 places",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },
  ],
});
