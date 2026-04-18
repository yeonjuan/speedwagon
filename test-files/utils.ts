export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function sanitizeEmail(value: string): string {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value.trim() : "";
}

export function isPhoneNumber(value: string): boolean {
  return /^\d{3}-\d{4}-\d{4}$/.test(value);
}
