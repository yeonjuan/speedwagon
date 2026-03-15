import { parseSync, Module } from '@swc/core';
import * as fs from 'fs';
import { Language, FileInfo } from '../types';
import { FileEntry } from '../traverser';

export class CodeParser {
  parse(fileEntry: FileEntry): FileInfo {
    const code = fs.readFileSync(fileEntry.absolutePath, 'utf-8');
    const ast = this.parseCode(code, fileEntry.language);

    return {
      path: fileEntry.path,
      language: fileEntry.language,
      ast,
    };
  }

  parseMany(fileEntries: FileEntry[]): FileInfo[] {
    return fileEntries.map((entry) => this.parse(entry));
  }

  private parseCode(code: string, language: Language): Module {
    const isTsx = language === 'tsx';
    const isTypescript = language === 'typescript' || isTsx;
    const isJsx = language === 'jsx' || isTsx;

    return parseSync(code, {
      syntax: isTypescript ? 'typescript' : 'ecmascript',
      tsx: isTsx,
      jsx: isJsx,
    });
  }
}
