import { describe, it, expect } from "vitest";
import { Visitor } from "oxc-parser";
import type { Rule } from "../rules/types.js";
import { CollectorContext } from "../collectors/index.js";
import { RuleContext } from "../rules/index.js";
import {
  tsLanguage,
  tsxLanguage,
  jsLanguage,
  jsxLanguage,
  type Language,
} from "../languages/index.js";

const languages: Language[] = [
  jsxLanguage,
  tsxLanguage,
  jsLanguage,
  tsLanguage,
];

interface ExpectedOccurrence {
  line: number;
  column: number;
}

interface ExpectedReport {
  description?: string;
  occurrences?: ExpectedOccurrence[];
}

interface FileEntry {
  code: string;
  filename: string;
}

interface ValidCase {
  code?: string;
  filename?: string;
  files?: FileEntry[];
  options?: Record<string, unknown>;
}

interface InvalidCase {
  code?: string;
  filename?: string;
  files?: FileEntry[];
  options?: Record<string, unknown>;
  reports: ExpectedReport[];
}

interface TestCases {
  valid?: ValidCase[];
  invalid?: InvalidCase[];
}

export class RuleTester {
  constructor(private readonly rule: Rule) {}

  run(cases: TestCases) {
    describe(this.rule.id, () => {
      if (cases.valid) {
        describe("valid", () => {
          for (const testCase of cases.valid!) {
            const name = this.getTestName(testCase);
            it(name, async () => {
              const reports = await this.getReports(testCase);
              expect(reports).toHaveLength(0);
            });
          }
        });
      }

      if (cases.invalid) {
        describe("invalid", () => {
          for (const testCase of cases.invalid!) {
            const name = this.getTestName(testCase);
            it(name, async () => {
              const reports = await this.getReports(testCase);
              expect(reports).toHaveLength(testCase.reports.length);
              for (let i = 0; i < testCase.reports.length; i++) {
                const { occurrences, ...rest } = testCase.reports[i];
                expect(reports[i]).toMatchObject(rest);
                if (occurrences) {
                  expect(reports[i].occurrences).toHaveLength(
                    occurrences.length,
                  );
                  for (let j = 0; j < occurrences.length; j++) {
                    expect(
                      reports[i].occurrences![j].location.start,
                    ).toMatchObject(occurrences[j]);
                  }
                }
              }
            });
          }
        });
      }
    });
  }

  private getTestName(testCase: ValidCase | InvalidCase): string {
    if (testCase.code) return testCase.code;
    if (testCase.files) return testCase.files.map((f) => f.code).join(" | ");
    return "";
  }

  private async getReports(testCase: ValidCase | InvalidCase) {
    const files: FileEntry[] = testCase.files
      ? [...testCase.files]
      : [
          {
            code: testCase.code ?? "",
            filename: testCase.filename ?? "test.ts",
          },
        ];

    const options = {
      ...(this.rule.defaultOptions ?? {}),
      ...testCase.options,
    };
    const collectContexts = new Map(
      this.rule.collectors.map((collector) => [
        collector.id,
        new CollectorContext(),
      ]),
    );

    for (const { code, filename } of files) {
      const language =
        languages.find((lang) => lang.match(filename)) ?? tsLanguage;
      const program = await language.parse(code, filename);

      for (const collector of this.rule.collectors) {
        const collectContext = collectContexts.get(collector.id)!;
        const mutationApi = collectContext.mutationApi(filename, code);
        const visitor = new Visitor(
          collector.createJSVisitor(mutationApi, options),
        );
        visitor.visit(program);
      }
    }

    const ruleContext = new RuleContext(this.rule);
    this.rule.check(
      ruleContext,
      this.rule.collectors.map(
        (collector) => collectContexts.get(collector.id)!,
      ),
      options,
    );

    return ruleContext.getReports();
  }
}
