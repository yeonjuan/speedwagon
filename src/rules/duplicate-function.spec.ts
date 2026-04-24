import { RuleTester } from "../test-utils/index.js";
import { duplicateFunction } from "./duplicate-function.js";

const tester = new RuleTester(duplicateFunction);

tester.run({
  valid: [
    { code: `function f(a: number): number { return a; }` },

    {
      code: `
function f() { return 1; }
function g() { return 2; }
      `.trim(),
    },

    {
      code: `
function f(a: number) { return a; }
function g(a: number, b: number) { return a; }
      `.trim(),
    },

    {
      code: `
function f(): number { return 1; }
function g() { return 1; }
      `.trim(),
    },

    {
      code: `
function f<T>(a: T): T { return a; }
function g(a: number): number { return a; }
      `.trim(),
    },

    {
      code: `
function f(a: number[]) { return a[0]; }
function g(a: number[]) { return a[1]; }
      `.trim(),
    },

    {
      code: `
function f(a: any) { return a.b; }
function g(a: any) { return a[0]; }
      `.trim(),
    },

    {
      code: `
function f(a: any) { return a.name; }
function g(a: any) { return a.id; }
      `.trim(),
    },

    {
      code: `
function f(a: number, b: number) { return a + b; }
function g(a: number, b: number) { return a - b; }
      `.trim(),
    },

    {
      code: `
function f() { return { x: 1, y: 2 }; }
function g() { return { x: 1, y: 3 }; }
      `.trim(),
    },

    {
      code: `
function f() { return { x: 1 }; }
function g() { return { x: 1, y: 2 }; }
      `.trim(),
    },

    {
      code: `
function f(a: number) { return { value: a }; }
function g(a: number) { return { result: a }; }
      `.trim(),
    },

    {
      code: `
function f(a: number, b: number) { return a; }
function g(a: number, b: number) { return b; }
      `.trim(),
    },

    {
      code: `
function f<T>(a: T): T { return a; }
function g<T, U>(a: T, b: U): T { return a; }
      `.trim(),
    },

    {
      code: `
function hasCompatTags(entry) {
  return (
    typeof entry === "object" &&
    entry &&
    "__compat" in entry &&
    entry.__compat.tags
  );
}
function isStaticString(node) {
  return (
    (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") ||
    (node.type === AST_NODE_TYPES.TemplateLiteral &&
      node.expressions.length === 0 &&
      node.quasis.length === 1)
  );
}
      `.trim(),
    },

    {
      code: `
const a = {
  plugins: {
    get ["@html-eslint/svelte"]() { return plugin; },
  },
};
const b = {
  plugins: {
    get "@html-eslint"() { return plugin; },
  },
};
      `.trim(),
    },

    {
      code: `
class A { foo(a: number) { return a; } }
class B { foo(a: number) { return a; } }
      `.trim(),
    },

    {
      code: `
const a = { foo(x: number) { return x; } };
const b = { foo(x: number) { return x; } };
      `.trim(),
    },
  ],

  invalid: [
    {
      code: `
function f(a: number) { return a; }
function g(a: number) { return a; }
      `.trim(),
      reports: [
        {
          description: "Function `f` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },

    {
      code: `
function add(x: number, y: number): number { return x + y; }
function sum(a: number, b: number): number { return a + b; }
      `.trim(),
      reports: [
        {
          description: "Function `add` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },

    {
      code: `
function f<T>(a: T): T { return a; }
function g<U>(b: U): U { return b; }
      `.trim(),
      reports: [
        {
          description: "Function `f` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },

    {
      code: `
function f<T>(a: T, b: T): T { return a; }
function g<U>(x: U, y: U): U { return x; }
      `.trim(),
      reports: [
        {
          description: "Function `f` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },

    {
      code: `
function f(obj: any) { return obj.name; }
function g(user: any) { return user.name; }
      `.trim(),
      reports: [
        {
          description: "Function `f` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },

    {
      code: `
function f(arr: number[]) { return arr[0]; }
function g(list: number[]) { return list[0]; }
      `.trim(),
      reports: [
        {
          description: "Function `f` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },

    {
      code: `
function f() { return { x: 1, y: 2 }; }
function g() { return { x: 1, y: 2 }; }
      `.trim(),
      reports: [
        {
          description: "Function `f` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },

    {
      code: `
function f(a: number) { return { value: a }; }
function g(b: number) { return { value: b }; }
      `.trim(),
      reports: [
        {
          description: "Function `f` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },

    {
      code: `
const f = (a: number) => a * 2;
const g = (b: number) => b * 2;
      `.trim(),
      reports: [
        {
          description: "Function `<anonymous>` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 11 },
            { line: 2, column: 11 },
          ],
        },
      ],
    },

    {
      code: `
function a(x: number, y: number) { return x + y; }
function b(x: number, y: number) { return x + y; }
function c(x: number, y: number) { return x + y; }
      `.trim(),
      reports: [
        {
          description: "Function `a` is duplicated 3 times",
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
function f1(a: number) { return a + 1; }
function f2(a: number) { return a + 2; }
function g1(b: number) { return b + 1; }
function g2(b: number) { return b + 2; }
      `.trim(),
      reports: [
        {
          description: "Function `f1` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 1 },
            { line: 3, column: 1 },
          ],
        },
        {
          description: "Function `f2` is duplicated 2 times",
          occurrences: [
            { line: 2, column: 1 },
            { line: 4, column: 1 },
          ],
        },
      ],
    },

    {
      code: `
async function f(a: number) { return a; }
async function g(b: number) { return b; }
      `.trim(),
      reports: [
        {
          description: "Function `f` is duplicated 2 times",
          occurrences: [
            { line: 1, column: 1 },
            { line: 2, column: 1 },
          ],
        },
      ],
    },
  ],
});
