import type {
  GlobalContext,
  CollectorContext,
  Store,
  Maybe,
  Location,
  CollectorInfo,
} from "../types/index.js";

export class Context implements GlobalContext {
  public readonly store: Store;

  constructor() {
    this.store = new Map();
  }

  private set<T>(namespace: string, key: string, value: T): void {
    if (!this.store.has(namespace)) {
      this.store.set(namespace, new Map());
    }
    const namespaceMap = this.store.get(namespace)!;
    namespaceMap.set(key, value);
  }

  private get<T>(namespace: string, key: string): Maybe<T> {
    const namespaceMap = this.store.get(namespace);
    if (!namespaceMap) {
      return undefined;
    }
    return namespaceMap.get(key) as Maybe<T>;
  }

  private getAll<T>(namespace: string): Map<string, T> {
    const namespaceMap = this.store.get(namespace);
    if (!namespaceMap) {
      return new Map();
    }
    return namespaceMap as Map<string, T>;
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

  createCollectorContext(namespace: string): CollectorContext {
    if (!this.store.has(namespace)) {
      this.store.set(namespace, new Map());
    }

    return {
      addInfo: <T>(
        key: string,
        id: string,
        location: Location,
        snippet: string,
        data: T,
      ): void => {
        const existing = this.get<CollectorInfo<T>[]>(namespace, key) ?? [];
        existing.push({ id, location, snippet, data });
        this.set(namespace, key, existing);
      },
      getAllInfos: <T>(): Map<string, CollectorInfo<T>[]> => {
        return this.getAll<CollectorInfo<T>[]>(namespace);
      },
    };
  }
}
