const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/i;

export function validateEmail(value: string) {
  return /^[\w.-]+@[\w.-]+\.\w+$/i.test(value);
}

export function sanitizeEmail(value: string) {
  return /^[\w.-]+@[\w.-]+\.\w+$/i.test(value) ? value.trim() : "";
}

const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;

export function validatePhone(value: string) {
  return /^\d{3}-\d{4}-\d{4}$/.test(value);
}
