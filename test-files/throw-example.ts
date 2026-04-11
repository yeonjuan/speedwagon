export function getUserById(id: string) {
  if (!id) {
    throw new Error("invalid id");
  }
  return id;
}

export function updateUserById(id: number): number {
  if (!id) {
    throw new Error("invalid id");
  }
  return id;
}

// export function deleteUserById(id: string) {
//   if (!id) {
//     throw new Error("invalid id");
//   }
// }

// export function parseNumber(value: string) {
//   const num = Number(value);
//   if (isNaN(num)) {
//     throw new TypeError("not a number");
//   }
//   return num;
// }

// export function divide(a: number, b: number) {
//   if (b === 0) {
//     throw new RangeError("division by zero");
//   }
//   return a / b;
// }

// export function sqrt(value: number) {
//   if (value < 0) {
//     throw new RangeError("division by zero");
//   }
//   return Math.sqrt(value);
// }
