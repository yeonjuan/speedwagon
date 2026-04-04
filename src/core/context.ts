import type {
  GlobalContext,
  DetectorContext,
  ReportContext,
  Store,
  Report,
} from "../types/index.js";

export class Context implements GlobalContext {
  public readonly store: Store;

  constructor() {
    this.store = new Map();
  }

  set<T>(namespace: string, key: string, value: T): void {
    if (!this.store.has(namespace)) {
      this.store.set(namespace, new Map());
    }
    const namespaceMap = this.store.get(namespace)!;
    namespaceMap.set(key, value);
  }

  get<T>(namespace: string, key: string): T | undefined {
    const namespaceMap = this.store.get(namespace);
    if (!namespaceMap) {
      return undefined;
    }
    return namespaceMap.get(key) as T | undefined;
  }

  getAll<T>(namespace: string): Map<string, T> {
    const namespaceMap = this.store.get(namespace);
    if (!namespaceMap) {
      return new Map();
    }
    return namespaceMap as Map<string, T>;
  }

  has(namespace: string, key: string): boolean {
    const namespaceMap = this.store.get(namespace);
    if (!namespaceMap) {
      return false;
    }
    return namespaceMap.has(key);
  }

  clear(namespace: string): void {
    this.store.delete(namespace);
  }

  clearAll(): void {
    this.store.clear();
  }

  getNamespaces(): string[] {
    return Array.from(this.store.keys());
  }

  size(): number {
    let total = 0;
    for (const namespaceMap of this.store.values()) {
      total += namespaceMap.size;
    }
    return total;
  }

  createDetectorContext(namespace: string): DetectorContext {
    if (!this.store.has(namespace)) {
      this.store.set(namespace, new Map());
    }

    return {
      set: <T>(key: string, value: T): void => {
        this.set(namespace, key, value);
      },
      get: <T>(key: string): T | undefined => {
        return this.get<T>(namespace, key);
      },
      getAll: <T>(): Map<string, T> => {
        return this.getAll<T>(namespace);
      },
      has: (key: string): boolean => {
        return this.has(namespace, key);
      },
      clear: (): void => {
        this.clear(namespace);
      },
    };
  }

  createReportContext(): ReportContext {
    const reports: Report[] = [];

    return {
      addReport: (report: Report): void => {
        reports.push(report);
      },
      getReports: (): Report[] => {
        return reports;
      },
    };
  }
}
