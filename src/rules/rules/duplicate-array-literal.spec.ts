import { RuleTester } from "../../test-utils/index.js";
import { duplicateArrayLiteral } from "./duplicate-array-literal.js";

const tester = new RuleTester(duplicateArrayLiteral);

tester.run({
  valid: [
    // only one occurrence
    { code: `const A = [1, 2, 3];` },
    // single element — too short
    { code: `const A = [1]; const B = [1];` },
    // empty array
    { code: `const A = []; const B = [];` },
    // contains non-primitive (identifier)
    { code: `const A = [x, 1]; const B = [x, 1];` },
    // contains object
    { code: `const A = [{}, 1]; const B = [{}, 1];` },
    // contains spread
    { code: `const A = [...x, 1]; const B = [...x, 1];` },
    // contains hole (elision)
    { code: `const A = [,1]; const B = [,1];` },
    // different contents
    { code: `const A = [1, 2]; const B = [1, 3];` },
  ],
  invalid: [
    {
      code: `
const A = ["1", 1, 2];
const B = ["1", 1, 2];
      `.trim(),
      reports: [
        {
          description: `["1",1,2] is duplicated 2 times`,
          suggestion: "Extract the array into a shared constant and reuse it",
        },
      ],
    },
    {
      code: `
const A = [true, false, null];
const B = [true, false, null];
      `.trim(),
      reports: [
        {
          description: `[true,false,null] is duplicated 2 times`,
        },
      ],
    },
    {
      // order matters
      code: `
const A = [1, 2, 3];
const B = [1, 2, 3];
const C = [1, 2, 3];
      `.trim(),
      reports: [
        {
          description: `[1,2,3] is duplicated 3 times`,
        },
      ],
    },
    {
      // different order → not duplicate
      code: `
const A = [1, 2];
const B = [1, 2];
      `.trim(),
      reports: [
        {
          description: `[1,2] is duplicated 2 times`,
        },
      ],
    },
  ],
});
