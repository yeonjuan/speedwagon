import type { Reporter, ResolvedReport } from "./types.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderReport(report: ResolvedReport, index: number): string {
  const occurrences = report.occurrences
    ? report.occurrences
        .map(
          ({ path, location }) =>
            `<li class="occurrence">${escapeHtml(path)}:${location.start.line}:${location.start.column}</li>`,
        )
        .join("")
    : "";

  const suggestion = report.suggestion
    ? `<p class="suggestion">💡 ${escapeHtml(report.suggestion)}</p>`
    : "";

  return `
    <div class="report">
      <h3>${index + 1}. <span class="rule-id">[${escapeHtml(report.ruleId)}]</span> ${escapeHtml(report.description)}</h3>
      ${suggestion}
      ${occurrences ? `<ul>${occurrences}</ul>` : ""}
    </div>`;
}

export class HtmlReporter implements Reporter {
  readonly name = "html";

  report(reports: ResolvedReport[]): string {
    const summary =
      reports.length === 0
        ? `<p class="no-issues">No duplicates found.</p>`
        : `<p class="summary">${reports.length} problem(s) found.</p>`;

    const body = reports.map((r, i) => renderReport(r, i)).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dedupe Report</title>
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #222; }
    h1 { border-bottom: 2px solid #eee; padding-bottom: .5rem; }
    .report { border: 1px solid #ddd; border-radius: 6px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
    .rule-id { color: #888; font-size: .9em; }
    .suggestion { color: #555; margin: .25rem 0 .5rem; }
    ul { margin: .25rem 0 0; padding-left: 1.5rem; }
    .occurrence { font-family: monospace; font-size: .9em; color: #0070c1; }
    .summary { font-weight: bold; color: #c8400f; }
    .no-issues { font-weight: bold; color: #2e7d32; }
  </style>
</head>
<body>
  <h1>Dedupe Report</h1>
  ${summary}
  ${body}
</body>
</html>`;
  }
}
