import { parseSync } from "oxc-parser";
import { Context } from "../core/context.js";
import type {
  Detector,
  DetectorContext,
  ReportContext,
  Report,
} from "../types/index.js";

export interface TestFile {
  path: string;
  code: string;
  lang?: "ts" | "tsx" | "js" | "jsx";
}

export class DetectorTester {
  private detector: Detector;
  private collectContext: DetectorContext;
  private reportContext: ReportContext;

  constructor(detector: Detector) {
    this.detector = detector;
    const globalContext = new Context();
    this.collectContext = globalContext.createDetectorContext(detector.name);
    this.reportContext = globalContext.createReportContext();
  }

  async test(files: TestFile[]): Promise<Report[]> {
    for (const file of files) {
      const lang = file.lang ?? "ts";
      const result = parseSync(file.path, file.code, { lang });

      const collector = this.detector.createCollector(
        this.collectContext,
        file.path,
        file.code,
      );
      const visitor = collector.visitor();
      visitor.visit(result.program);
    }

    await this.detector.analyze(this.collectContext, this.reportContext);

    return this.reportContext.getReports();
  }

  async testSingleFile(code: string, filePath = "/test/file.ts"): Promise<Report[]> {
    return this.test([{ path: filePath, code }]);
  }

  getCollectContext(): DetectorContext {
    return this.collectContext;
  }

  getReportContext(): ReportContext {
    return this.reportContext;
  }
}
