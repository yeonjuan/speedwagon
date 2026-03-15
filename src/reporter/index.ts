import { AnalysisResult, ReporterOptions } from '../types';
import { JsonReporter } from './json-reporter';
import { HtmlReporter } from './html-reporter';

export class Reporter {
  private jsonReporter = new JsonReporter();
  private htmlReporter = new HtmlReporter();

  generate(result: AnalysisResult, options: ReporterOptions): void {
    if (options.format === 'json') {
      this.jsonReporter.generate(result, options.outputPath);
    } else if (options.format === 'html') {
      this.htmlReporter.generate(result, options.outputPath);
    }
  }
}

export { JsonReporter } from './json-reporter';
export { HtmlReporter } from './html-reporter';
