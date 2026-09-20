export type BcdBrowserName = string;
export type BrowserslistName = string;

export interface BrowserTarget {
  browserslistName: BrowserslistName;
  bcdName: BcdBrowserName | null;
  version: string;
}

export interface ResolvedConfig {
  cwd: string;
  rawTargets: string[];
  minVersions: Map<BrowserslistName, string>;
  targets: BrowserTarget[];
  unsupportedBrowsers: BrowserslistName[];
  configSource: string;
}

export type FeatureKind =
  | "member"
  | "new"
  | "identifier"
  | "css-property"
  | "css-value"
  | "css-at-rule";

export interface FoundFeature {
  kind: FeatureKind;
  filePath: string;
  line: number;
  column: number;
  object: string | null;
  name: string;
  value?: string;
}

export interface BrowserConflict {
  browser: BrowserslistName;
  bcdBrowser: BcdBrowserName;
  targetVersion: string;
  requiredVersion: string | null;
}

export interface Conflict {
  filePath: string;
  line: number;
  column: number;
  feature: string;
  bcdPath: string;
  mdnUrl: string | null;
  browsers: BrowserConflict[];
}
