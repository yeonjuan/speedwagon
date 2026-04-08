import { parseSync } from "oxc-parser";
import { Context } from "../core/context.js";
import type { Rule, RuleContext, Report } from "../types/index.js";

export interface TestFile {
  path: string;
  code: string;
  lang?: "ts" | "tsx" | "js" | "jsx";
}

export class RuleTester {
  private collector: Rule;
  private collectContext: RuleContext;

  constructor(collector: Rule) {
    this.collector = collector;
    const globalContext = new Context();
    this.collectContext = globalContext.createRuleContext(collector.name);
  }

  async test(files: TestFile[]): Promise<Report[]> {
    for (const file of files) {
      const lang = file.lang ?? "ts";
      const result = parseSync(file.path, file.code, { lang });

      const visitorObj = this.collector.createVisitor(
        this.collectContext,
        file.path,
        file.code,
      );
      const visitor = visitorObj.visitor();
      visitor.visit(result.program);
    }

    return this.collector.report(this.collectContext);
  }

  async testSingleFile(
    code: string,
    filePath = "/test/file.ts",
  ): Promise<Report[]> {
    return this.test([{ path: filePath, code }]);
  }

  getCollectContext(): RuleContext {
    return this.collectContext;
  }
}
