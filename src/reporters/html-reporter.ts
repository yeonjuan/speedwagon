import { readFile } from "fs/promises";
import type { RuleContext } from "../rules/index.js";
import { getSnippet } from "../utils/index.js";
import type { SnippetLine } from "../utils/index.js";
import type { ResolvedReport } from "../rules/types.js";

function escape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSnippet(lines: SnippetLine[]): string {
  return lines
    .map((line) => {
      const num = String(line.lineNumber).padStart(4);
      const content = escape(line.content);
      const cls = line.highlighted ? ' class="hl"' : "";
      return `<span${cls}>${num} | ${content}</span>`;
    })
    .join("\n");
}

type Occurrence = NonNullable<ResolvedReport["occurrences"]>[number];

async function renderOccurrence(
  path: string,
  location: Occurrence["location"],
  fileCache: Map<string, string>,
): Promise<string> {
  let code = fileCache.get(path);
  if (code === undefined) {
    code = await readFile(path, "utf-8").catch(() => "");
    fileCache.set(path, code);
  }
  const lines = getSnippet(code, location);
  const { line, column } = location.start;
  return `
    <div class="occurrence">
      <div class="path">${escape(path)}<span class="pos">:${line}:${column}</span></div>
      <pre><code>${renderSnippet(lines)}</code></pre>
    </div>`;
}

async function renderReport(
  report: ResolvedReport,
  fileCache: Map<string, string>,
): Promise<string> {
  const occurrences = report.occurrences ?? [];
  const renderedOccurrences = await Promise.all(
    occurrences.map((o) => renderOccurrence(o.path, o.location, fileCache)),
  );
  return `
    <div class="report">
      <div class="description">${escape(report.description)}</div>
      ${renderedOccurrences.join("")}
    </div>`;
}

async function renderRule(
  ruleId: string,
  reports: ResolvedReport[],
  fileCache: Map<string, string>,
): Promise<string> {
  const renderedReports = await Promise.all(
    reports.map((r) => renderReport(r, fileCache)),
  );
  return `
  <section class="rule">
    <h2 class="rule-id">${escape(ruleId)}<span class="count">${reports.length}</span></h2>
    ${renderedReports.join("")}
  </section>`;
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f5; color: #222; padding: 2rem; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .summary { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
  .rule { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 1.5rem; overflow: hidden; }
  .rule-id { font-size: 1rem; font-family: monospace; padding: 0.75rem 1rem; background: #f0f0f0; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; gap: 0.5rem; }
  .count { background: #d32f2f; color: #fff; font-size: 0.75rem; padding: 0.1rem 0.5rem; border-radius: 999px; font-family: sans-serif; }
  .report { padding: 1rem; border-bottom: 1px solid #f0f0f0; }
  .report:last-child { border-bottom: none; }
  .description { font-weight: 600; margin-bottom: 0.75rem; color: #c62828; }
  .occurrence { margin-bottom: 0.75rem; }
  .occurrence:last-child { margin-bottom: 0; }
  .path { font-family: monospace; font-size: 0.8rem; color: #555; margin-bottom: 0.25rem; }
  .pos { color: #999; }
  pre { background: #1e1e1e; color: #d4d4d4; border-radius: 4px; overflow-x: auto; font-size: 0.8rem; line-height: 1.5; }
  pre code { display: block; padding: 0.75rem 1rem; white-space: pre; }
  span.hl { display: block; background: rgba(255, 200, 0, 0.15); border-left: 3px solid #ffc800; margin-left: -1rem; padding-left: calc(1rem - 3px); }
`;

export class HtmlReporter {
  async report(ruleContexts: Map<string, RuleContext>): Promise<string> {
    const fileCache = new Map<string, string>();
    const sections: string[] = [];
    let totalReports = 0;

    for (const [ruleId, ruleContext] of ruleContexts) {
      const reports = ruleContext.getReports();
      if (reports.length === 0) continue;
      totalReports += reports.length;
      sections.push(await renderRule(ruleId, reports, fileCache));
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>speedwagon report</title>
  <style>${CSS}</style>
</head>
<body>
  <h1>speedwagon</h1>
  <p class="summary">${totalReports} issue${totalReports !== 1 ? "s" : ""} found</p>
  ${sections.join("")}
</body>
</html>`;
  }
}
