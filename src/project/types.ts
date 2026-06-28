export interface PackageInfo {
  name: string;
  rootPath: string;
}

export interface MonorepoInfo {
  packages: PackageInfo[];
}

export interface ProjectContext {
  rootPath: string;
  monorepo?: MonorepoInfo;
}
