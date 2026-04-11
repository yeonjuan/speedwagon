import { RuleTester } from "../../test-utils/index.js";
import { similarFunctionDefinition } from "./similar-function-definition.js";

const tester = new RuleTester(similarFunctionDefinition);

tester.run({
  valid: [
    // single function
    { code: `function f(a, b) { return a + b; }` },
    // different structure (different operator)
    { code: `function f(a) { return a + 1; } function g(a) { return a * 2; }` },
    // same structure but different literal values
    { code: `function f(a) { return a + 1; } function g(a) { return a + 2; }` },
    // different template literal content
    {
      code: "function f(x) { return `hello ${x}`; } function g(x) { return `world ${x}`; }",
    },
    // same structure but different param count
    { code: `function f(a) { return a; } function g(a, b) { return a; }` },
    // async vs non-async → different key
    { code: `async function f(a) { return a; } function g(a) { return a; }` },
    // empty bodies are too trivial — single body hash, only 1 occurrence counts
    { code: `function f() {} ` },
  ],
  invalid: [
    {
      // same identifier-normalized structure
      code: `
function getUser(id) { return db.find(id); }
function getPost(id) { return db.find(id); }
      `.trim(),
      reports: [
        {
          description: "Similar function bodies found (2 occurrences)",
          suggestion: "Extract the duplicated logic into a shared function",
        },
      ],
    },
    {
      // arrow functions
      code: `
const double = (x) => x * 2;
const triple = (x) => x * 2;
      `.trim(),
      reports: [
        { description: "Similar function bodies found (2 occurrences)" },
      ],
    },
    {
      // function expressions
      code: `
const a = function(x) { return x + 1; };
const b = function(y) { return y + 1; };
      `.trim(),
      reports: [
        { description: "Similar function bodies found (2 occurrences)" },
      ],
    },
    {
      // three similar functions
      code: `
function a(x) { console.log(x); }
function b(x) { console.log(x); }
function c(x) { console.log(x); }
      `.trim(),
      reports: [
        { description: "Similar function bodies found (3 occurrences)" },
      ],
    },
  ],
});
