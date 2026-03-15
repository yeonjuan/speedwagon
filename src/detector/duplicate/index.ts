import { FileInfo, DuplicateCode, CodeLocation } from '../../types';
import {
  FunctionDeclaration,
  ClassDeclaration,
  VariableDeclaration,
  Node,
} from '@swc/core';
import * as fs from 'fs';
import { normalizeCode, calculateLineNumbers } from '../../utils/ast-utils';

interface CodeBlock {
  code: string;
  normalizedCode: string;
  location: CodeLocation;
}

export class DuplicateDetector {
  detect(fileInfos: FileInfo[]): DuplicateCode[] {
    const codeBlocks: CodeBlock[] = [];

    for (const fileInfo of fileInfos) {
      const fileContent = fs.readFileSync(fileInfo.path, 'utf-8');
      const blocks = this.extractCodeBlocks(fileInfo, fileContent);
      codeBlocks.push(...blocks);
    }

    return this.findDuplicates(codeBlocks);
  }

  private extractCodeBlocks(fileInfo: FileInfo, fileContent: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const { body } = fileInfo.ast;

    for (const item of body) {
      if (item.type === 'ExportDeclaration' || item.type === 'ExportDefaultDeclaration') {
        const declaration = item.type === 'ExportDeclaration' ? item.declaration : item;
        if (declaration && declaration.span) {
          const code = fileContent.substring(declaration.span.start, declaration.span.end);
          const { startLine, endLine } = calculateLineNumbers(declaration.span, fileContent);

          blocks.push({
            code,
            normalizedCode: normalizeCode(code),
            location: {
              filePath: fileInfo.path,
              startLine,
              endLine,
            },
          });
        }
      } else if (
        item.type === 'FunctionDeclaration' ||
        item.type === 'ClassDeclaration' ||
        item.type === 'VariableDeclaration'
      ) {
        if (item.span) {
          const code = fileContent.substring(item.span.start, item.span.end);
          const { startLine, endLine } = calculateLineNumbers(item.span, fileContent);

          blocks.push({
            code,
            normalizedCode: normalizeCode(code),
            location: {
              filePath: fileInfo.path,
              startLine,
              endLine,
            },
          });
        }
      }
    }

    return blocks;
  }

  private findDuplicates(codeBlocks: CodeBlock[]): DuplicateCode[] {
    const duplicateMap = new Map<string, CodeBlock[]>();

    for (const block of codeBlocks) {
      if (block.normalizedCode.length < 50) {
        continue;
      }

      const existing = duplicateMap.get(block.normalizedCode) || [];
      existing.push(block);
      duplicateMap.set(block.normalizedCode, existing);
    }

    const duplicates: DuplicateCode[] = [];

    for (const [normalizedCode, blocks] of duplicateMap.entries()) {
      if (blocks.length > 1) {
        duplicates.push({
          code: blocks[0].code,
          locations: blocks.map((b) => b.location),
        });
      }
    }

    return duplicates;
  }
}
