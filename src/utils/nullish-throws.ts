export function nullishThrows<T>(value: T | null | undefined, name: string): T {
  if (value == null) {
    throw new Error(`${name} is nullish`);
  }
  return value;
}
