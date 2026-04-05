import type { LogicalExpressionInfo } from "./types.js";
import { getPosition, createCollector, isObjectNode } from "../../utils/index.js";
import { TYPE_LOGICAL_EXPRESSION, TYPE_IDENTIFIER } from "../../constants.js";

function getOperandCount(node: any): number {
  if (node.type === TYPE_LOGICAL_EXPRESSION) {
    return getOperandCount(node.left) + getOperandCount(node.right);
  }
  return 1;
}

export interface LogicalExpressionDetectorConfig {
  minOperands?: number;
}

export const logicalExpressionCollector = (
  config: LogicalExpressionDetectorConfig,
) =>
  createCollector((context, filePath, sourceCode) => {
    let counter = 0;
    const minOperands = config.minOperands ?? 2;
    const visitedLogicalExpressions = new Set<string>();

    function markVisited(n: any) {
      if (!isObjectNode(n)) return;
      if (n.type === TYPE_LOGICAL_EXPRESSION) {
        visitedLogicalExpressions.add(`${n.start}:${n.end}`);
        markVisited(n.left);
        markVisited(n.right);
      }
    }

    return {
      LogicalExpression: (node) => {
        const range = `${node.start}:${node.end}`;
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

          if (n.type === TYPE_LOGICAL_EXPRESSION) {
            findTargets(n.left);
            findTargets(n.right);
            return;
          }
          if (n.type === "BinaryExpression") {
            findTargets(n.left);
            findTargets(n.right);
            return;
          }
          if (n.type === "UnaryExpression" || n.type === "UpdateExpression") {
            findTargets(n.argument);
            return;
          }
          if (n.type === "CallExpression") {
            findTargets(n.callee, { isCallee: true });
            for (const arg of n.arguments || []) {
              findTargets(arg);
            }
            return;
          }

          if (n.type === "MemberExpression") {
            const obj = n.object;
            let shouldParameterize = true;
            if (obj.type === TYPE_IDENTIFIER && /^[A-Z]/.test(obj.name)) {
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

          if (n.type === TYPE_IDENTIFIER) {
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
          uniqueTargetsMap.set(`${t.start}:${t.end}`, t);
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

        const id = `${filePath}:${counter++}`;
        const raw = sourceCode.slice(node.start, node.end);

        const info: LogicalExpressionInfo = {
          id,
          normalized,
          raw,
          operandsCount,
          location: {
            file: filePath,
            start: getPosition(sourceCode, node.start),
            end: getPosition(sourceCode, node.end),
          },
        };

        const existing = context.get<LogicalExpressionInfo[]>(normalized) ?? [];
        existing.push(info);
        context.set(normalized, existing);
      },
    };
  });
