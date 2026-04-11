import { RuleTester } from "../../test-utils/index.js";
import { definedType } from "./defined-type.js";

const tester = new RuleTester(definedType);

tester.run({
  valid: [
    {
      code: `
type Status = "a" | "b";
function foo(arg: Status) {}
      `.trim(),
    },
    {
      code: `
type Status = "a" | "b";
const x: Status = "a";
      `.trim(),
    },
    {
      code: `function foo(arg: "a" | "b") {}`,
    },
    {
      code: `
type A = "x" | "y";
type B = "x" | "z";
function foo(arg: "x" | "w") {}
      `.trim(),
    },
  ],
  invalid: [
    {
      // basic union: non-exported type
      code: `
type Status = "a" | "b";
function foo(arg: "a" | "b") {}
      `.trim(),
      reports: [
        {
          description: '"a"|"b" is already defined as Status',
          suggestion: "Use the existing type: Status",
        },
      ],
    },
    {
      // order-independent: "b" | "a" matches type Status = "a" | "b"
      code: `
type Status = "a" | "b";
function foo(arg: "b" | "a") {}
      `.trim(),
      reports: [
        {
          description: '"a"|"b" is already defined as Status',
        },
      ],
    },
    {
      // exported type → import suggestion
      code: `
export type Role = "admin" | "user" | "guest";
function hasPermission(role: "admin" | "user" | "guest"): boolean { return true; }
      `.trim(),
      reports: [
        {
          description: '"admin"|"guest"|"user" is already defined as Role',
          suggestion:
            'Import and use the existing type: import type { Role } from "..."',
        },
      ],
    },
    {
      // intersection type
      code: `
type Entity = { id: number } & { name: string };
function save(entity: { id: number } & { name: string }) {}
      `.trim(),
      reports: [
        {
          description: "{id:number}&{name:string} is already defined as Entity",
        },
      ],
    },
    {
      // union of object types (order-independent)
      code: `
type Shape = { kind: "circle"; radius: number } | { kind: "rect"; width: number };
function draw(s: { kind: "rect"; width: number } | { kind: "circle"; radius: number }) {}
      `.trim(),
      reports: [
        {
          description:
            '{kind:"circle";radius:number}|{kind:"rect";width:number} is already defined as Shape',
        },
      ],
    },
    {
      // intersection of object type and union (parenthesized union)
      code: `
type Entity = { id: number } & ("active" | "inactive");
function save(e: { id: number } & ("active" | "inactive")) {}
      `.trim(),
      reports: [
        {
          description:
            '"active"|"inactive"&{id:number} is already defined as Entity',
        },
      ],
    },
    {
      // exported intersection with union inside property
      code: `
export type Tagged = { tag: "a" | "b" } & { value: string };
function process(t: { tag: "a" | "b" } & { value: string }) {}
      `.trim(),
      reports: [
        {
          description:
            '{tag:"a"|"b"}&{value:string} is already defined as Tagged',
          suggestion:
            'Import and use the existing type: import type { Tagged } from "..."',
        },
      ],
    },
    {
      // multiple usages of the same defined type
      code: `
type Status = "active" | "inactive";
function enable(s: "active" | "inactive") {}
function disable(s: "active" | "inactive") {}
      `.trim(),
      reports: [
        {
          description: '"active"|"inactive" is already defined as Status',
          occurrences: [
            { line: 2, column: 20 },
            { line: 3, column: 21 },
          ],
        },
      ],
    },
  ],
});
