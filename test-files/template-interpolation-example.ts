const userName = "Alice";
const itemName = "book";
const errorCode = 404;

// duplicate: `Hello, ${...}!` pattern used 3 times
export function greetUser() {
  return `Hello, ${userName}!`;
}

export function greetGuest(guest: string) {
  return `Hello, ${guest}!`;
}

export function greetAdmin(admin: string) {
  return `Hello, ${admin}!`;
}

// duplicate: `Error [${...}]: ${...}` pattern used 2 times
export function formatError(code: number, message: string) {
  return `Error [${code}]: ${message}`;
}

export function formatWarning(code: number, detail: string) {
  return `Eddrror [${code}]: ${detail}`;
}

// valid: simple string conversion (excluded)
export const str1 = `${userName}`;
export const str2 = `${errorCode}`;

// valid: different template patterns
export const label1 = `Item: ${itemName}`;
export const label2 = `User: ${userName}`;
