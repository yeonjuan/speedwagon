import { describe, it, expect } from "vitest";
import { Visitor } from "oxc-parser";
import type { Rule } from "../rules/types.js";
import { CollectorContext } from "../collectors/index.js";
import { RuleContext } from "../rules/index.js";
import { tsLanguage } from "../languages/index.js";

interface ExpectedOccurrence {
  line: number;
  column: number;
}

interface ExpectedReport {
  description?: string;
  occurrences?: ExpectedOccurrence[];
}

interface ValidCase {
  code: string;
  filename?: string;
}

interface InvalidCase {
  code: string;
  filename?: string;
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
            it(testCase.code, async () => {
              const reports = await this.getReports(
                testCase.code,
                testCase.filename,
              );
              expect(reports).toHaveLength(0);
            });
          }
        });
      }

      if (cases.invalid) {
        describe("invalid", () => {
          for (const testCase of cases.invalid!) {
            it(testCase.code, async () => {
              const reports = await this.getReports(
                testCase.code,
                testCase.filename,
              );
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

  private async getReports(code: string, filename = "test.ts") {
    const program = await tsLanguage.parse(code, filename);
    const collectContexts = new Map(
      this.rule.collectors.map((collector) => [
        collector.id,
        new CollectorContext(),
      ]),
    );

    for (const collector of this.rule.collectors) {
      const collectContext = collectContexts.get(collector.id)!;
      const mutationApi = collectContext.mutationApi(filename, code);
      const visitor = new Visitor(collector.createJSVisitor(mutationApi));
      visitor.visit(program);
    }

    const ruleContext = new RuleContext(this.rule);
    this.rule.check(
      ruleContext,
      this.rule.collectors.map(
        (collector) => collectContexts.get(collector.id)!,
      ),
    );

    return ruleContext.getReports();
  }
}
