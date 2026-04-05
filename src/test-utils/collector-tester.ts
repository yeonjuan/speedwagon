import { parseSync } from "oxc-parser";
import { Context } from "../core/context.js";
import type {
  Collector,
  CollectorContext,
  Report,
} from "../types/index.js";

export interface TestFile {
  path: string;
  code: string;
  lang?: "ts" | "tsx" | "js" | "jsx";
}

export class CollectorTester {
  private collector: Collector;
  private collectContext: CollectorContext;

  constructor(collector: Collector) {
    this.collector = collector;
    const globalContext = new Context();
    this.collectContext = globalContext.createCollectorContext(collector.name);
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

  getCollectContext(): CollectorContext {
    return this.collectContext;
  }
}
