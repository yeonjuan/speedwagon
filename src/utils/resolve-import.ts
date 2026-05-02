import fs from "node:fs";
import path from "node:path";

interface TsConfig {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

const EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
];

const INDEX_FILES = ["index.ts", "index.tsx", "index.js", "index.jsx"];

const JS_TO_TS: Record<string, string[]> = {
  ".js": [".ts", ".tsx"],
  ".jsx": [".tsx", ".jsx"],
  ".mjs": [".mts"],
  ".cjs": [".cts"],
};

function resolveToFilePath(basePath: string): string | null {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return basePath;
  }

  const ext = path.extname(basePath);
  if (ext && JS_TO_TS[ext]) {
    for (const tsExt of JS_TO_TS[ext]) {
      const tsPath = basePath.slice(0, -ext.length) + tsExt;
      if (fs.existsSync(tsPath)) return tsPath;
    }
  }

  if (!ext) {
    for (const tryExt of EXTENSIONS) {
      const withExt = basePath + tryExt;
      if (fs.existsSync(withExt)) return withExt;
    }
    for (const index of INDEX_FILES) {
      const indexPath = path.join(basePath, index);
      if (fs.existsSync(indexPath)) return indexPath;
    }
  }

  return null;
}

const tsConfigCache = new Map<
  string,
  { config: TsConfig; configDir: string } | null
>();

function findTsConfig(
  startDir: string,
): { config: TsConfig; configDir: string } | null {
  if (tsConfigCache.has(startDir)) {
    return tsConfigCache.get(startDir) ?? null;
  }

  let dir = startDir;
  while (true) {
    const tsConfigPath = path.join(dir, "tsconfig.json");
    if (fs.existsSync(tsConfigPath)) {
      try {
        const content = fs.readFileSync(tsConfigPath, "utf-8");
        const config = JSON.parse(content) as TsConfig;
        const result = { config, configDir: dir };
        tsConfigCache.set(startDir, result);
        return result;
      } catch {
        break;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  tsConfigCache.set(startDir, null);
  return null;
}

function resolveWithPathAliases(
  importSource: string,
  config: TsConfig,
  configDir: string,
): string | null {
  const { compilerOptions } = config;
  if (!compilerOptions) return null;

  const { baseUrl, paths } = compilerOptions;
  const resolvedBaseUrl = baseUrl
    ? path.resolve(configDir, baseUrl)
    : configDir;

  if (paths) {
    for (const [pattern, replacements] of Object.entries(paths)) {
      const isWildcard = pattern.endsWith("/*");
      const prefix = isWildcard ? pattern.slice(0, -1) : pattern;

      if (
        isWildcard ? importSource.startsWith(prefix) : importSource === pattern
      ) {
        const suffix = isWildcard ? importSource.slice(prefix.length) : "";
        for (const replacement of replacements) {
          const resolvedReplacement = isWildcard
            ? replacement.replace("*", suffix)
            : replacement;
          const resolved = path.resolve(resolvedBaseUrl, resolvedReplacement);
          const file = resolveToFilePath(resolved);
          if (file) return file;
        }
      }
    }
  }

  if (baseUrl) {
    const resolved = path.resolve(resolvedBaseUrl, importSource);
    const file = resolveToFilePath(resolved);
    if (file) return file;
  }

  return null;
}

export function resolveImport(
  filePath: string,
  importSource: string,
): string | null {
  const fileDir = path.dirname(filePath);

  if (importSource.startsWith(".")) {
    const basePath = path.resolve(fileDir, importSource);
    return resolveToFilePath(basePath);
  }

  const tsConfigResult = findTsConfig(fileDir);
  if (tsConfigResult) {
    const resolved = resolveWithPathAliases(
      importSource,
      tsConfigResult.config,
      tsConfigResult.configDir,
    );
    if (resolved) return resolved;
  }

  return null;
}
