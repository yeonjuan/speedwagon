import { glob } from 'glob';
import * as path from 'path';
import { Language } from '../types';

export interface TraverseOptions {
  patterns: string[];
  cwd?: string;
}

export interface FileEntry {
  path: string;
  absolutePath: string;
  language: Language;
}

export class FileTraverser {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  async traverse(options: TraverseOptions): Promise<FileEntry[]> {
    const files: FileEntry[] = [];

    for (const pattern of options.patterns) {
      const matches = await glob(pattern, {
        cwd: options.cwd || this.cwd,
        absolute: false,
        nodir: true,
      });

      for (const match of matches) {
        const absolutePath = path.resolve(options.cwd || this.cwd, match);
        const language = this.detectLanguage(match);

        if (language) {
          files.push({
            path: match,
            absolutePath,
            language,
          });
        }
      }
    }

    return files;
  }

  private detectLanguage(filePath: string): Language | null {
    const ext = path.extname(filePath);

    switch (ext) {
      case '.js':
        return 'javascript';
      case '.jsx':
        return 'jsx';
      case '.ts':
        return 'typescript';
      case '.tsx':
        return 'tsx';
      default:
        return null;
    }
  }
}
