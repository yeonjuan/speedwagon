export function normalizeVersion(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;

  if (value.startsWith("≤")) value = value.slice(1);

  const rangeIndex = value.indexOf("-");
  if (rangeIndex > 0) value = value.slice(0, rangeIndex);

  if (!/^\d+(\.\d+)*$/.test(value)) return null;
  return value;
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const length = Math.max(pa.length, pb.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function minVersion(a: string, b: string): string {
  return compareVersions(a, b) <= 0 ? a : b;
}

export function maxVersion(a: string, b: string): string {
  return compareVersions(a, b) >= 0 ? a : b;
}
