export type CategoryConfig = Record<string, Record<string, unknown>>;

export interface Config {
  ignores?: string[];
  complexity?: CategoryConfig;
  duplication?: CategoryConfig;
}
