import type {
  Detector,
  GlobalContext,
  CollectorFactory,
} from "../../types/index.js";
import { MagicNumberCollector } from "./collector.js";
import { MagicNumberAnalyzer } from "./analyzer.js";

export class MagicNumberDetector implements Detector {
  readonly name = "magic-number";
  readonly description =
    "Detects duplicate constant literals (magic numbers and strings)";

  private readonly minOccurrences: number;

  constructor(minOccurrences: number = 3) {
    this.minOccurrences = minOccurrences;
  }

  createCollector: CollectorFactory = (
    context: GlobalContext,
    filePath: string,
    sourceCode: string,
  ) => {
    return new MagicNumberCollector(context, filePath, sourceCode);
  };

  async analyze(context: GlobalContext) {
    const analyzer = new MagicNumberAnalyzer(this.minOccurrences);
    return analyzer.analyze(context);
  }
}
