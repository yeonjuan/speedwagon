import { FileInfo, UnusedCode, ExportInfo, ImportInfo } from '../../types';
import { calculateLineNumbers } from '../../utils/ast-utils';
import * as fs from 'fs';

export class UnusedCodeDetector {
  detect(fileInfos: FileInfo[]): UnusedCode[] {
    const exports = this.collectExports(fileInfos);
    const imports = this.collectImports(fileInfos);

    const unusedCodes: UnusedCode[] = [];

    for (const exp of exports) {
      const isUsed = imports.some((imp) => imp.name === exp.name);

      if (!isUsed) {
        unusedCodes.push({
          name: exp.name,
          type: exp.type,
          location: exp.location,
        });
      }
    }

    return unusedCodes;
  }

  private collectExports(fileInfos: FileInfo[]): ExportInfo[] {
    const exports: ExportInfo[] = [];

    for (const fileInfo of fileInfos) {
      const fileContent = fs.readFileSync(fileInfo.path, 'utf-8');
      const { body } = fileInfo.ast;

      for (const item of body) {
        if (item.type === 'ExportDeclaration') {
          const { declaration } = item;

          if (declaration.type === 'FunctionDeclaration' && declaration.identifier) {
            const { startLine, endLine } = calculateLineNumbers(declaration.span, fileContent);
            exports.push({
              name: declaration.identifier.value,
              type: 'function',
              location: {
                filePath: fileInfo.path,
                startLine,
                endLine,
              },
            });
          } else if (declaration.type === 'ClassDeclaration' && declaration.identifier) {
            const { startLine, endLine } = calculateLineNumbers(declaration.span, fileContent);
            exports.push({
              name: declaration.identifier.value,
              type: 'class',
              location: {
                filePath: fileInfo.path,
                startLine,
                endLine,
              },
            });
          } else if (declaration.type === 'VariableDeclaration') {
            for (const decl of declaration.declarations) {
              if (decl.id.type === 'Identifier') {
                const { startLine, endLine } = calculateLineNumbers(declaration.span, fileContent);
                exports.push({
                  name: decl.id.value,
                  type: 'variable',
                  location: {
                    filePath: fileInfo.path,
                    startLine,
                    endLine,
                  },
                });
              }
            }
          } else if (declaration.type === 'TsInterfaceDeclaration' || declaration.type === 'TsTypeAliasDeclaration') {
            const { startLine, endLine } = calculateLineNumbers(declaration.span, fileContent);
            exports.push({
              name: declaration.id.value,
              type: 'type',
              location: {
                filePath: fileInfo.path,
                startLine,
                endLine,
              },
            });
          }
        } else if (item.type === 'ExportNamedDeclaration' && item.specifiers) {
          for (const specifier of item.specifiers) {
            if (specifier.type === 'ExportSpecifier' && specifier.orig) {
              const { startLine, endLine } = calculateLineNumbers(item.span, fileContent);
              exports.push({
                name: specifier.orig.value,
                type: 'variable',
                location: {
                  filePath: fileInfo.path,
                  startLine,
                  endLine,
                },
              });
            }
          }
        }
      }
    }

    return exports;
  }

  private collectImports(fileInfos: FileInfo[]): ImportInfo[] {
    const imports: ImportInfo[] = [];

    for (const fileInfo of fileInfos) {
      const fileContent = fs.readFileSync(fileInfo.path, 'utf-8');
      const { body } = fileInfo.ast;

      for (const item of body) {
        if (item.type === 'ImportDeclaration') {
          const source = item.source.value;

          for (const specifier of item.specifiers) {
            if (specifier.type === 'ImportSpecifier' && specifier.local) {
              const { startLine, endLine } = calculateLineNumbers(item.span, fileContent);
              imports.push({
                name: specifier.local.value,
                source,
                location: {
                  filePath: fileInfo.path,
                  startLine,
                  endLine,
                },
              });
            } else if (specifier.type === 'ImportDefaultSpecifier') {
              const { startLine, endLine } = calculateLineNumbers(item.span, fileContent);
              imports.push({
                name: specifier.local.value,
                source,
                location: {
                  filePath: fileInfo.path,
                  startLine,
                  endLine,
                },
              });
            }
          }
        }
      }
    }

    return imports;
  }
}
