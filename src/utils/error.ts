export function createParseError(message: string): Error {
  return new Error(`Parse error: ${message}`);
}
