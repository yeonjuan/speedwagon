import { RuleTester } from "../../test-utils/index.js";
import { duplicateUrlString } from "./duplicate-url-string.js";

const tester = new RuleTester(duplicateUrlString);

tester.run({
  valid: [
    // only one occurrence
    { code: `const a = "https://example.com/api";` },
    // non-URL strings
    { code: `const a = "hello"; const b = "hello";` },
    // different URLs
    {
      code: `const a = "https://example.com/a"; const b = "https://example.com/b";`,
    },
    // http and https treated separately
    {
      code: `const a = "http://example.com"; const b = "https://example.com";`,
    },
  ],
  invalid: [
    {
      code: `
const a = "https://example.com/api";
const b = "https://example.com/api";
      `.trim(),
      reports: [
        {
          description: '"https://example.com/api" is duplicated 2 times',
          suggestion: "Extract the URL into a shared constant and reuse it",
        },
      ],
    },
    {
      code: `
fetch("https://api.example.com/users");
fetch("https://api.example.com/users");
fetch("https://api.example.com/users");
      `.trim(),
      reports: [
        {
          description: '"https://api.example.com/users" is duplicated 3 times',
        },
      ],
    },
    {
      code: `
const BASE = "http://localhost:3000/api";
axios.get("http://localhost:3000/api");
      `.trim(),
      reports: [
        {
          description: '"http://localhost:3000/api" is duplicated 2 times',
        },
      ],
    },
  ],
});
