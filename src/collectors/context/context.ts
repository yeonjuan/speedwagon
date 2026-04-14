import { nullishThrows } from "../../utils/nullish-throws.js";
import type {
  CollectorContextMutationAPI,
  CollectAddData,
  CollectRecord,
  Collection,
  CollectorQueryAPI,
} from "../types.js";

export class CollectorContext implements CollectorQueryAPI {
  private readonly map = new Map<string, Map<string, CollectRecord[]>>();
  private readonly sharedDataMap = new Map<string, Record<string, unknown>>();

  constructor() {}

  mutationApi(path: string, code: string): CollectorContextMutationAPI {
    return {
      path,
      code,
      add: ({ key, data, location }: CollectAddData) => {
        if (!this.map.has(key)) {
          this.map.set(key, new Map());
        }
        const pathMap = nullishThrows(this.map.get(key), `map.get(${key})`);
        if (!pathMap.has(path)) {
          pathMap.set(path, []);
        }
        pathMap.get(path)?.push({ data, location });
      },
    };
  }

  keys() {
    return this.map.keys();
  }

  getByKey(key: string): Collection[] {
    const pathMap = this.map.get(key);
    if (!pathMap) {
      return [];
    }
    const results: Collection[] = [];
    for (const [path, items] of pathMap) {
      for (const { location, data } of items) {
        results.push({ key, data, path, location });
      }
    }
    return results;
  }
}
