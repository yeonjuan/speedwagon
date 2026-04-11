// duplicate explicit: Direction and Move have same name:value pairs
export enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}

enum Move {
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
  Up = "UP",
}
function foo() {
  console.log("a");
  console.log("a");
  console.log("a");
  console.log("a");
}

function bar() {
  console.log("a");
  console.log("a");
  console.log("a");
  console.log("a");
}

// duplicate implicit: same ordered names
enum Fruit {
  Apple,
  Banana,
  Cherry,
}

enum Food {
  Apple,
  Banana,
  Cherry,
}

// valid: different order (implicit values differ)
enum Reversed {
  Cherry,
  Banana,
  Apple,
}

// valid: different values
enum HttpStatus {
  OK = 200,
  NotFound = 404,
}

enum CustomStatus {
  OK = 200,
  NotFound = 400,
}
