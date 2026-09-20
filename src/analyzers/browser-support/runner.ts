import fs from "node:fs/promises";
import { logger } from "../../logger.js";
import type { Language } from "../../languages/types.js";
import { resolveConfig, browserDisplayName } from "./resolver.js";
import { matchFeatures } from "./bcd-mapper.js";
import { collectJsFeatures } from "./js-scanner.js";
import { collectCssFeatures } from "./css-scanner.js";
import { maxVersion } from "./version.js";
import type { Conflict, FoundFeature, ResolvedConfig } from "./types.js";

interface ReportLocation {
  filePath: string;
  line: number;
  column: number;
}

interface ReportItem {
  message: string;
  locations: ReportLocation[];
}

interface SupportedBrowser {
  name: string;
  version: string | null;
}

interface BrowserSupportResult {
  items: ReportItem[];
  supportedBrowsers: SupportedBrowser[];
  warnings: string[];
}

function isCssFile(filePath: string): boolean {
  return filePath.endsWith(".css") || filePath.endsWith(".scss");
}

/**
 * For every configured browser, the lowest version the scanned code actually
 * supports: the configured target raised to the highest version required by
 * a conflicting feature. `null` means some used API is never supported.
 */
function computeEffectiveSupport(
  config: ResolvedConfig,
  conflicts: Conflict[],
): Map<string, string | null> {
  const effective = new Map<string, string | null>();
  for (const [name, version] of config.minVersions)
    effective.set(name, version);

  for (const conflict of conflicts) {
    for (const browser of conflict.browsers) {
      const current = effective.get(browser.browser);
      if (current === null) continue;
      if (browser.requiredVersion === null) {
        effective.set(browser.browser, null);
        continue;
      }
      effective.set(
        browser.browser,
        current
          ? maxVersion(current, browser.requiredVersion)
          : browser.requiredVersion,
      );
    }
  }
  return effective;
}

function formatConflict(conflict: Conflict): string {
  const browsers = conflict.browsers
    .map(
      (b) =>
        `${browserDisplayName(b.browser)} ${b.targetVersion} -> ${b.requiredVersion ?? "unsupported"}`,
    )
    .join(", ");
  return `\`${conflict.feature}\` is not supported by target browsers (${browsers})`;
}

export async function runBrowserSupportAnalyzer(
  filePaths: string[],
  languages: Language[],
  cwd: string,
): Promise<BrowserSupportResult> {
  let config;
  try {
    config = resolveConfig({ cwd });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { items: [], supportedBrowsers: [], warnings: [message] };
  }

  const features: FoundFeature[] = [];

  for (const filePath of filePaths) {
    if (isCssFile(filePath)) {
      let content: string;
      try {
        content = await fs.readFile(filePath, "utf-8");
      } catch {
        logger.debug(`Failed to read ${filePath}`);
        continue;
      }
      try {
        features.push(
          ...collectCssFeatures(content, filePath, filePath.endsWith(".scss")),
        );
      } catch {
        logger.debug(`Failed to parse ${filePath}`);
      }
      continue;
    }

    const language = languages.find((lang) => lang.match(filePath));
    if (!language) continue;

    logger.debug(`Processing ${filePath}`);

    let sourceCode: string;
    try {
      sourceCode = await fs.readFile(filePath, "utf-8");
    } catch {
      logger.debug(`Failed to read ${filePath}`);
      continue;
    }

    try {
      const program = await language.parse(sourceCode, filePath);
      features.push(...collectJsFeatures(program, sourceCode, filePath));
    } catch {
      logger.debug(`Failed to parse ${filePath}`);
    }
  }

  const { conflicts } = matchFeatures(features, config.targets);

  const items: ReportItem[] = conflicts.map((conflict) => ({
    message: formatConflict(conflict),
    locations: [
      {
        filePath: conflict.filePath,
        line: conflict.line,
        column: conflict.column,
      },
    ],
  }));

  const effectiveSupport = computeEffectiveSupport(config, conflicts);
  const supportedBrowsers: SupportedBrowser[] = [...effectiveSupport.entries()]
    .map(([id, version]) => ({ name: browserDisplayName(id), version }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { items, supportedBrowsers, warnings: [] };
}
