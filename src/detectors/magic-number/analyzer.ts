import type {
  GlobalContext,
  Report,
  DuplicateEntry,
} from "../../types/index.js";
import type { ConstantLiteral, ConstantGroup } from "./types.js";
import { readFileSync } from "fs";

export class MagicNumberAnalyzer {
  private readonly namespace = "magic-number";
  private readonly minOccurrences: number;

  constructor(minOccurrences: number = 3) {
    this.minOccurrences = minOccurrences;
  }

  async analyze(context: GlobalContext): Promise<Report[]> {
    const reports: Report[] = [];

    const allConstants = context.getAll<ConstantLiteral[]>(this.namespace);

    const groups = this.groupConstants(allConstants);

    for (const group of groups) {
      if (group.count >= this.minOccurrences) {
        const report = this.createReport(group);
        reports.push(report);
      }
    }

    reports.sort((a, b) => b.duplicates.length - a.duplicates.length);

    return reports;
  }

  private groupConstants(
    allConstants: Map<string, ConstantLiteral[]>,
  ): ConstantGroup[] {
    const groups: ConstantGroup[] = [];

    for (const [key, literals] of allConstants.entries()) {
      if (literals.length < this.minOccurrences) {
        continue;
      }

      const first = literals[0];
      groups.push({
        value: first.value,
        type: first.type,
        occurrences: literals,
        count: literals.length,
      });
    }

    return groups;
  }

  private createReport(group: ConstantGroup): Report {
    const duplicates: DuplicateEntry[] = group.occurrences.map((literal) => {
      const snippet = this.extractSnippet(literal);

      return {
        location: literal.location,
        snippet,
        metadata: {
          value: literal.value,
          type: literal.type,
        },
      };
    });

    const valueStr = this.formatValue(group.value, group.type);

    return {
      type: "magic-number",
      similarity: 100, // Exact duplicates
      duplicates,
      description: `Constant value ${valueStr} appears ${group.count} times across the codebase`,
      suggestion: this.generateSuggestion(group),
    };
  }

  private extractSnippet(literal: ConstantLiteral): string {
    try {
      const content = readFileSync(literal.location.file, "utf-8");
      const lines = content.split("\n");
      const lineIndex = literal.location.start.line - 1; // Convert to 0-based

      const startLine = Math.max(0, lineIndex - 1);
      const endLine = Math.min(lines.length, lineIndex + 2);

      return lines.slice(startLine, endLine).join("\n").trim();
    } catch (error) {
      return `// Unable to extract snippet: ${error}`;
    }
  }

  private formatValue(
    value: string | number | boolean | bigint,
    type: string,
  ): string {
    if (type === "string") {
      return `"${value}"`;
    }
    return String(value);
  }

  private generateSuggestion(group: ConstantGroup): string {
    const valueStr = this.formatValue(group.value, group.type);

    if (group.type === "string") {
      return `Consider extracting ${valueStr} into a named constant (e.g., const MY_CONSTANT = ${valueStr})`;
    }

    if (group.type === "number") {
      return `This magic number ${valueStr} appears ${group.count} times. Consider extracting it into a named constant with a descriptive name.`;
    }

    return `Consider extracting this ${group.type} value into a named constant.`;
  }
}
