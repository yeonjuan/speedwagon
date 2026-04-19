const MAX_LENGTH = 50;

export function getDisplayName(
  code: string,
  start: number,
  end: number,
): string {
  const raw = code.slice(start, end).replace(/\s+/g, " ").trim();
  return raw.length > MAX_LENGTH ? raw.slice(0, MAX_LENGTH) + "..." : raw;
}
