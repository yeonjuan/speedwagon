import type { LogicalExpressionInfo } from "./types.js";
import { formatId } from "../../utils/index.js";
import {
  getPosition,
  createCollector,
  isObjectNode,
  extractSnippet,
} from "../../utils/index.js";
import { AST_TYPES } from "../../constants/index.js";

function getOperandCount(node: any): number {
  if (node.type === AST_TYPES.LogicalExpression) {
    return getOperandCount(node.left) + getOperandCount(node.right);
  }
  return 1;
}

export interface LogicalExpressionCollectorConfig {
  minOperands?: number;
}

export const logicalExpressionCollector = (
  config: LogicalExpressionCollectorConfig,
) =>
  createCollector((context, filePath, sourceCode) => {
    let counter = 0;
    const minOperands = config.minOperands ?? 2;
    const visitedLogicalExpressions = new Set<string>();

    function markVisited(n: any) {
      if (!isObjectNode(n)) return;
      if (n.type === AST_TYPES.LogicalExpression) {
        visitedLogicalExpressions.add(formatId(n.start, n.end));
        markVisited(n.left);
        markVisited(n.right);
      }
    }

    return {
      [AST_TYPES.LogicalExpression]: (node) => {
        const range = formatId(node.start, node.end);
        if (visitedLogicalExpressions.has(range)) return;

        markVisited(node);

        const operandsCount = getOperandCount(node);
        if (operandsCount < minOperands) return;

        const targets: { start: number; end: number; raw: string }[] = [];

        function findTargets(n: any, ctx: { isCallee?: boolean } = {}) {
          if (!isObjectNode(n)) return;
          if (Array.isArray(n)) {
            for (const item of n) findTargets(item, ctx);
            return;
          }

          if (n.type === AST_TYPES.LogicalExpression) {
            findTargets(n.left);
            findTargets(n.right);
            return;
          }
          if (n.type === AST_TYPES.BinaryExpression) {
            findTargets(n.left);
            findTargets(n.right);
            return;
          }
          if (
            n.type === AST_TYPES.UnaryExpression ||
            n.type === AST_TYPES.UpdateExpression
          ) {
            findTargets(n.argument);
            return;
          }
          if (n.type === AST_TYPES.CallExpression) {
            findTargets(n.callee, { isCallee: true });
            for (const arg of n.arguments || []) {
              findTargets(arg);
            }
            return;
          }

          if (n.type === AST_TYPES.MemberExpression) {
            const obj = n.object;
            let shouldParameterize = true;
            if (obj.type === AST_TYPES.Identifier && /^[A-Z]/.test(obj.name)) {
              shouldParameterize = false;
            }
            if (shouldParameterize) {
              targets.push({
                start: obj.start,
                end: obj.end,
                raw: sourceCode.slice(obj.start, obj.end),
              });
            } else {
              findTargets(obj);
            }
            if (n.computed) {
              findTargets(n.property);
            }
            return;
          }

          if (n.type === AST_TYPES.Identifier) {
            if (ctx.isCallee) return;
            if (/^[A-Z]/.test(n.name)) return;

            targets.push({
              start: n.start,
              end: n.end,
              raw: sourceCode.slice(n.start, n.end),
            });
            return;
          }

          for (const key in n) {
            if (
              key === "type" ||
              key === "start" ||
              key === "end" ||
              key === "loc"
            )
              continue;
            findTargets(n[key]);
          }
        }

        findTargets(node);

        const validTargets = targets.filter((t, i) => {
          return !targets.some((other, j) => {
            if (i === j) return false;
            return other.start <= t.start && other.end >= t.end;
          });
        });

        // Deduplicate targets that have exact same start and end
        const uniqueTargetsMap = new Map<string, (typeof targets)[0]>();
        for (const t of validTargets) {
          uniqueTargetsMap.set(formatId(t.start, t.end), t);
        }
        const flatTargets = Array.from(uniqueTargetsMap.values());

        flatTargets.sort((a, b) => b.start - a.start);

        const paramMap = new Map<string, string>();
        let paramCounter = 1;

        let normalized = sourceCode.slice(node.start, node.end);

        for (const t of flatTargets) {
          let param = paramMap.get(t.raw);
          if (!param) {
            param = `$${paramCounter++}`;
            paramMap.set(t.raw, param);
          }
          const relStart = t.start - node.start;
          const relEnd = t.end - node.start;
          normalized =
            normalized.slice(0, relStart) + param + normalized.slice(relEnd);
        }

        const raw = sourceCode.slice(node.start, node.end);
        const location = {
          file: filePath,
          start: getPosition(sourceCode, node.start),
          end: getPosition(sourceCode, node.end),
        };
        const snippet = extractSnippet(sourceCode, location, {
          expandLines: 2,
        });
        context.addInfo(
          normalized,
          formatId(filePath, counter++),
          location,
          snippet,
          { normalized, raw, operandsCount },
        );
      },
    };
  });
