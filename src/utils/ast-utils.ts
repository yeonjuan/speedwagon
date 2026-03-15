import { Span } from '@swc/core';

export function getNodeCode(node: any, code: string): string {
  if (!node.span) {
    return '';
  }
  return code.substring(node.span.start, node.span.end);
}

export function calculateLineNumbers(span: Span, code: string): { startLine: number; endLine: number } {
  const beforeCode = code.substring(0, span.start);
  const nodeCode = code.substring(span.start, span.end);

  const startLine = beforeCode.split('\n').length;
  const endLine = startLine + nodeCode.split('\n').length - 1;

  return { startLine, endLine };
}

export function normalizeCode(code: string): string {
  return code
    .replace(/\s+/g, ' ')
    .replace(/;\s*$/, '')
    .trim();
}
