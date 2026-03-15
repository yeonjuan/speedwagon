import * as fs from 'fs';
import * as path from 'path';
import { AnalysisResult } from '../types';

export class JsonReporter {
  generate(result: AnalysisResult, outputPath: string): void {
    const json = JSON.stringify(result, null, 2);
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, json, 'utf-8');
    console.log(`JSON report generated: ${outputPath}`);
  }
}
