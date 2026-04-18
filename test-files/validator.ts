export function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function validatePassword(password: string): boolean {
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatUsername(username: string): string {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username) ? username.toLowerCase() : "";
}
