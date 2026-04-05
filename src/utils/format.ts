export type StringOrNumber = string | number;

export function formatId(
  prefix: StringOrNumber,
  suffix: StringOrNumber,
): string {
  return `${prefix}:${suffix}`;
}

export function formatStringLiteral(value: StringOrNumber): string {
  return `"${value}"`;
}
