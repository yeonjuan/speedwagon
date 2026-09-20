import path from "node:path";
import { collectFiles } from "./collect-files.js";
import {
  parseArgs,
  generateHelp,
  type AnalyzerCategory,
} from "./optionator.js";
import { logger } from "../logger.js";
import {
  runDuplicationsAnalyzers,
  analyzers as duplicationsAnalyzers,
} from "../analyzers/duplications/index.js";
import {
  runUnusedAnalyzers,
  analyzers as unusedAnalyzers,
} from "../analyzers/unused/index.js";
import {
  runUselessAnalyzers,
  analyzers as uselessAnalyzers,
} from "../analyzers/useless/index.js";
import { runBrowserSupportAnalyzer } from "../analyzers/browser-support/index.js";
import { detectProject } from "../project/detect.js";
import { jsLanguage } from "../languages/js.js";
import { tsLanguage } from "../languages/ts.js";
import { jsxLanguage } from "../languages/jsx.js";
import { tsxLanguage } from "../languages/tsx.js";
import { cssModuleLanguage } from "../languages/css.js";
import { scssModuleLanguage } from "../languages/scss.js";
import type { Language, CssLanguage } from "../languages/types.js";

const LANGUAGES: Language[] = [
  jsLanguage,
  tsLanguage,
  jsxLanguage,
  tsxLanguage,
];

const CSS_LANGUAGES: CssLanguage[] = [cssModuleLanguage, scssModuleLanguage];

const JS_PATTERNS = LANGUAGES.flatMap((lang) =>
  lang.extensions.map((ext) => `**/*${ext}`),
);

const CSS_PATTERNS = CSS_LANGUAGES.flatMap((lang) =>
  lang.extensions.map((ext) => `**/*${ext}`),
);

const BROWSER_SUPPORT_CSS_PATTERNS = ["**/*.css", "**/*.scss"];

interface Location {
  filePath: string;
  line: number;
  column: number;
}

interface Section {
  title: string;
  emptyMessage: string;
  reports: { message: string; locations: Location[] }[];
  summaryLines?: string[];
}

export class CLI {
  async run(argv: string[]): Promise<void> {
    const args = parseArgs(argv);

    if (args.help) {
      console.log(generateHelp());
      return;
    }

    if (args.debug) logger.enable();

    const cwd = process.cwd();
    const categories = new Set<AnalyzerCategory>(args.categories);
    logger.debug(`Categories: ${[...categories].join(", ")}`);

    const defaultPatterns = [
      ...JS_PATTERNS,
      ...(categories.has("unused") ? CSS_PATTERNS : []),
      ...(categories.has("browser-support")
        ? BROWSER_SUPPORT_CSS_PATTERNS
        : []),
    ];
    const patterns = args.patterns.length > 0 ? args.patterns : defaultPatterns;
    const files = await collectFiles(patterns, {
      cwd,
      ignorePatterns: args.ignorePatterns,
    });

    const sections: Section[] = [];

    if (categories.has("duplication")) {
      const project = await detectProject(cwd);
      const reports = await runDuplicationsAnalyzers(
        files,
        LANGUAGES,
        duplicationsAnalyzers,
        project,
      );
      sections.push({
        title: "Duplications",
        emptyMessage: "No duplications found.",
        reports,
      });
    }

    if (categories.has("unused")) {
      const reports = await runUnusedAnalyzers(
        files,
        LANGUAGES,
        CSS_LANGUAGES,
        unusedAnalyzers,
      );
      sections.push({
        title: "Unused",
        emptyMessage: "No unused code found.",
        reports: reports.map((r) => ({
          message: r.message,
          locations: [r.location],
        })),
      });
    }

    if (categories.has("useless")) {
      const reports = await runUselessAnalyzers(
        files,
        LANGUAGES,
        uselessAnalyzers,
      );
      sections.push({
        title: "Useless",
        emptyMessage: "No useless code found.",
        reports: reports.map((r) => ({
          message: r.message,
          locations: [r.location],
        })),
      });
    }

    if (categories.has("browser-support")) {
      const { items, supportedBrowsers, warnings } =
        await runBrowserSupportAnalyzer(files, LANGUAGES, cwd);
      for (const warning of warnings) console.error(warning);
      const summaryLines =
        supportedBrowsers.length > 0
          ? [
              "Supported browsers:",
              ...supportedBrowsers.map(
                (b) =>
                  `  ${b.name} ${b.version === null ? "not supported" : `>= ${b.version}`}`,
              ),
              "",
            ]
          : [];
      sections.push({
        title: "Browser support",
        emptyMessage: "No browser support issues found.",
        reports: items,
        summaryLines,
      });
    }

    const multiple = sections.length > 1;
    sections.forEach((section, index) => {
      if (multiple) {
        if (index > 0) console.log("");
        console.log(`## ${section.title}`);
      }
      for (const line of section.summaryLines ?? []) console.log(line);
      if (section.reports.length === 0) {
        console.log(section.emptyMessage);
        return;
      }
      for (const report of section.reports) {
        console.log(report.message);
        for (const loc of report.locations) {
          const relPath = path.relative(cwd, loc.filePath);
          console.log(`  ${relPath}:${loc.line}:${loc.column}`);
        }
      }
    });
  }
}
