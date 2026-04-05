import type { Report, DuplicateEntry } from "../types/index.js";
import type { Reporter } from "./types.js";
import chalk from "chalk";
import { TYPE_STRING } from "../constants.js";

/**
 * Reporter that outputs to stdout with colored formatting
 */
export class StdoutReporter implements Reporter {
  readonly name = "stdout";

  report(reports: Report[]): void {
    if (reports.length === 0) {
      console.log(chalk.green("\n✓ No duplications found!\n"));
      return;
    }

    console.log(chalk.bold(`\n📊 Found ${reports.length} duplication(s)\n`));

    reports.forEach((report, index) => {
      this.printReport(report, index + 1);
    });

    console.log(
      chalk.bold(`\n📈 Summary: ${reports.length} duplication(s) found\n`),
    );
  }

  private printReport(report: Report, index: number): void {
    console.log(chalk.bold.cyan(`\n${index}. ${report.type}`));
    console.log(chalk.gray("─".repeat(80)));

    if (report.description) {
      console.log(chalk.yellow(`📝 ${report.description}`));
    }

    const similarityColor = this.getSimilarityColor(report.similarity);
    console.log(similarityColor(`🔍 Similarity: ${report.similarity}%`));

    console.log(chalk.bold(`\n📍 Locations (${report.duplicates.length}):`));
    report.duplicates.forEach((duplicate, idx) => {
      this.printDuplicate(duplicate, idx + 1);
    });

    if (report.suggestion) {
      console.log(chalk.green(`\n💡 Suggestion: ${report.suggestion}`));
    }

    console.log("");
  }

  private printDuplicate(duplicate: DuplicateEntry, index: number): void {
    const { location, snippet } = duplicate;

    const locationStr = `${location.file}:${location.start.line}:${location.start.column}`;
    console.log(chalk.blue(`\n  ${index}. ${locationStr}`));

    if (duplicate.metadata) {
      const metaStr = Object.entries(duplicate.metadata)
        .map(([key, value]) => `${key}: ${this.formatMetadataValue(value)}`)
        .join(", ");
      console.log(chalk.gray(`     ${metaStr}`));
    }

    if (snippet) {
      console.log(chalk.gray("     ┌──────"));
      const snippetLines = snippet.split("\n");
      snippetLines.forEach((line, idx) => {
        const lineNum = location.start.line + idx;
        console.log(chalk.gray(`  ${String(lineNum).padStart(3)} │ `) + line);
      });
      console.log(chalk.gray("     └──────"));
    }
  }

  private getSimilarityColor(similarity: number): typeof chalk {
    if (similarity === 100) {
      return chalk.red.bold;
    } else if (similarity >= 80) {
      return chalk.red;
    } else if (similarity >= 60) {
      return chalk.yellow;
    } else {
      return chalk.cyan;
    }
  }

  private formatMetadataValue(value: unknown): string {
    if (typeof value === TYPE_STRING) {
      return `"${value}"`;
    }
    return String(value);
  }
}
