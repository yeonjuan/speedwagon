import { RuleTester } from "../../test-utils/index.js";
import { duplicateThrow } from "./duplicate-throw.js";

const tester = new RuleTester(duplicateThrow);

tester.run({
  valid: [
    { code: 'throw new Error("something went wrong");' },
    { code: 'throw new Error("foo"); throw new Error("bar");' },
    { code: 'throw new Error("dup"); throw new TypeError("dup");' },
    { code: "throw new Error(message);" },
    { code: "throw new Error(`${message}`);" },
  ],
  invalid: [
    {
      code: 'throw new Error("invalid id"); throw new Error("invalid id");',
      reports: [
        {
          description: 'new Error("invalid id") is thrown 2 times',
          suggestion:
            "Extract the error into a shared factory function or constant",
          occurrences: [
            { line: 1, column: 1 },
            { line: 1, column: 32 },
          ],
        },
      ],
    },
    {
      code: `
throw new TypeError("not a number");
throw new TypeError("not a number");
throw new TypeError("not a number");
      `.trim(),
      reports: [
        {
          description: 'new TypeError("not a number") is thrown 3 times',
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
throw new Error("not found");
throw new RangeError("out of range");
throw new Error("not found");
throw new RangeError("out of range");
      `.trim(),
      reports: [
        {
          description: 'new Error("not found") is thrown 2 times',
        },
        {
          description: 'new RangeError("out of range") is thrown 2 times',
        },
      ],
    },
  ],
});
