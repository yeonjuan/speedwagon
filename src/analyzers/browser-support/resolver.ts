import browserslist from "browserslist";
import fs from "node:fs";
import path from "node:path";
import type { BrowserTarget, ResolvedConfig } from "./types.js";
import { minVersion, normalizeVersion } from "./version.js";

const BROWSERSLIST_TO_BCD: Record<string, string | null> = {
  chrome: "chrome",
  and_chr: "chrome_android",
  firefox: "firefox",
  and_ff: "firefox_android",
  safari: "safari",
  ios_saf: "safari_ios",
  edge: "edge",
  opera: "opera",
  op_mob: "opera_android",
  samsung: "samsunginternet_android",
  android: "webview_android",
  ie: "ie",
  node: "nodejs",
  deno: "deno",
  bun: "bun",
  op_mini: null,
  and_uc: null,
  and_qq: null,
  baidu: null,
  kaios: null,
  bb: null,
  ie_mob: null,
  electron: null,
};

const BROWSER_DISPLAY_NAMES: Record<string, string> = {
  chrome: "Chrome",
  and_chr: "Android Chrome",
  firefox: "Firefox",
  and_ff: "Android Firefox",
  safari: "Safari",
  ios_saf: "iOS Safari",
  edge: "Edge",
  opera: "Opera",
  op_mob: "Opera Mobile",
  op_mini: "Opera Mini",
  samsung: "Samsung Internet",
  android: "Android Browser",
  ie: "Internet Explorer",
  ie_mob: "IE Mobile",
  and_uc: "Android UC Browser",
  and_qq: "Android QQ Browser",
  baidu: "Baidu Browser",
  kaios: "KaiOS Browser",
  bb: "BlackBerry Browser",
  node: "Node.js",
  deno: "Deno",
  bun: "Bun",
  electron: "Electron",
};

export function browserDisplayName(browserslistName: string): string {
  return BROWSER_DISPLAY_NAMES[browserslistName] ?? browserslistName;
}

interface ResolveOptions {
  cwd: string;
  browsers?: string | string[];
}

export function resolveConfig(options: ResolveOptions): ResolvedConfig {
  const cwd = path.resolve(options.cwd);

  let rawTargets: string[];
  let configSource: string;
  try {
    if (options.browsers && options.browsers.length > 0) {
      rawTargets = browserslist(options.browsers, { path: cwd });
      configSource = "--browsers option";
    } else {
      const configPath = browserslist.findConfig(cwd)
        ? findConfigFile(cwd)
        : null;
      rawTargets = browserslist(undefined, { path: cwd });
      configSource = configPath ?? "browserslist defaults (no config found)";
    }
  } catch (error) {
    throw new Error(
      `Failed to resolve browserslist targets: ${errorMessage(error)}`,
    );
  }

  if (rawTargets.length === 0) {
    throw new Error(
      "browserslist query resolved to zero browsers. Check your browserslist config.",
    );
  }

  const { minVersions, unversioned } = buildMinVersionMap(rawTargets);
  const targets: BrowserTarget[] = [];
  const unsupportedBrowsers: string[] = [...unversioned];

  for (const [browserslistName, version] of minVersions) {
    const bcdName = BROWSERSLIST_TO_BCD[browserslistName];
    if (bcdName === undefined || bcdName === null) {
      unsupportedBrowsers.push(browserslistName);
      continue;
    }
    targets.push({ browserslistName, bcdName, version });
  }

  return {
    cwd,
    rawTargets,
    minVersions,
    targets,
    unsupportedBrowsers,
    configSource,
  };
}

interface MinVersionMap {
  minVersions: Map<string, string>;
  unversioned: string[];
}

function buildMinVersionMap(rawTargets: string[]): MinVersionMap {
  const minVersions = new Map<string, string>();
  const unversioned = new Set<string>();
  for (const entry of rawTargets) {
    const spaceIndex = entry.indexOf(" ");
    if (spaceIndex === -1) continue;
    const name = entry.slice(0, spaceIndex);
    const version = normalizeVersion(entry.slice(spaceIndex + 1));
    if (!version) {
      unversioned.add(name);
      continue;
    }
    const current = minVersions.get(name);
    minVersions.set(name, current ? minVersion(current, version) : version);
  }
  for (const name of minVersions.keys()) unversioned.delete(name);
  return { minVersions, unversioned: [...unversioned] };
}

function findConfigFile(cwd: string): string | null {
  let dir = cwd;
  for (;;) {
    for (const candidate of [".browserslistrc", "browserslist"]) {
      const file = path.join(dir, candidate);
      if (fs.existsSync(file)) return file;
    }
    const pkg = path.join(dir, "package.json");
    if (fs.existsSync(pkg)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(pkg, "utf8")) as {
          browserslist?: unknown;
        };
        if (parsed.browserslist !== undefined)
          return `${pkg} (browserslist field)`;
      } catch {}
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
