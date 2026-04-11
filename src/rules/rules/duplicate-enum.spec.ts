import { RuleTester } from "../../test-utils/index.js";
import { duplicateEnum } from "./duplicate-enum.js";

const tester = new RuleTester(duplicateEnum);

tester.run({
  valid: [
    // different explicit values
    { code: `enum A { X = 'x' } enum B { X = 'y' }` },
    // different names (implicit)
    { code: `enum A { X, Y } enum B { X, Z }` },
    // same names but different order (implicit — order matters for values)
    { code: `enum A { X, Y, Z } enum B { Z, Y, X }` },
    // mixed initializers — skip
    { code: `enum A { X = 1, Y } enum B { X = 1, Y }` },
    // non-literal initializer — skip
    { code: `enum A { X = 1 + 1 } enum B { X = 1 + 1 }` },
  ],
  invalid: [
    {
      // explicit: same name:value pairs (order-independent)
      code: `
enum Direction { Up = "UP", Down = "DOWN" }
enum Move { Down = "DOWN", Up = "UP" }
      `.trim(),
      reports: [
        {
          description: "Move has the same members as Direction",
          suggestion: "Use the existing enum: Direction",
        },
      ],
    },
    {
      // explicit: numeric values
      code: `
enum HttpOk { OK = 200, Created = 201 }
enum StatusOk { OK = 200, Created = 201 }
      `.trim(),
      reports: [
        {
          description: "StatusOk has the same members as HttpOk",
        },
      ],
    },
    {
      // implicit: same ordered names
      code: `
enum Fruit { Apple, Banana, Cherry }
enum Food { Apple, Banana, Cherry }
      `.trim(),
      reports: [
        {
          description: "Food has the same members as Fruit",
        },
      ],
    },
    {
      // exported → import suggestion
      code: `
export enum Role { Admin = "admin", User = "user" }
enum Permission { Admin = "admin", User = "user" }
      `.trim(),
      reports: [
        {
          description: "Permission has the same members as Role",
          suggestion:
            'Import and use the existing enum: import { Role } from "..."',
        },
      ],
    },
    {
      // three duplicates
      code: `
enum A { X = 1, Y = 2 }
enum B { X = 1, Y = 2 }
enum C { X = 1, Y = 2 }
      `.trim(),
      reports: [
        { description: "B has the same members as A" },
        { description: "C has the same members as A" },
      ],
    },
  ],
});
