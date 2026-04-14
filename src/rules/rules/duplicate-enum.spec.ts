import { RuleTester } from "../../test-utils/index.js";
import { duplicateEnum } from "./duplicate-enum.js";

const tester = new RuleTester(duplicateEnum);

tester.run({
  valid: [{ code: `enum A { X = 'x' } enum B { X = 'y' }` }],
  invalid: [
    {
      // explicit: same name:value pairs (order-independent)
      code: `
enum Direction { Up = "UP", Down = "DOWN" }
enum Move { Down = "DOWN", Up = "UP" }
      `.trim(),
      reports: [
        {
          description: "Duplicate enum",
        },
        {
          description: "Duplicate enum",
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
          description: "Duplicate enum",
        },
        {
          description: "Duplicate enum",
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
          description: "Duplicate enum",
        },
        {
          description: "Duplicate enum",
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
          description: "Duplicate enum",
        },
        {
          description: "Duplicate enum",
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
        { description: "Duplicate enum" },
        { description: "Duplicate enum" },
        { description: "Duplicate enum" },
      ],
    },
  ],
});
