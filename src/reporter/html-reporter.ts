import * as fs from 'fs';
import * as path from 'path';
import { AnalysisResult } from '../types';

export class HtmlReporter {
  generate(result: AnalysisResult, outputPath: string): void {
    const html = this.generateHtml(result);
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log(`HTML report generated: ${outputPath}`);
  }

  private generateHtml(result: AnalysisResult): string {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Analysis Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 30px;
      border-bottom: 3px solid #007bff;
      padding-bottom: 10px;
    }
    h2 {
      color: #555;
      margin-top: 40px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .section {
      margin-bottom: 40px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #007bff;
      color: white;
      font-weight: 600;
    }
    tr:hover {
      background-color: #f8f9fa;
    }
    .duplicate-item {
      margin-bottom: 30px;
      padding: 20px;
      background-color: #f8f9fa;
      border-left: 4px solid #dc3545;
      border-radius: 4px;
    }
    .code-block {
      background-color: #282c34;
      color: #abb2bf;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 10px 0;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      white-space: pre-wrap;
    }
    .location {
      margin: 5px 0;
      padding: 8px;
      background-color: white;
      border-radius: 3px;
      font-size: 14px;
    }
    .location-path {
      color: #007bff;
      font-weight: 500;
    }
    .location-line {
      color: #6c757d;
      margin-left: 10px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 10px;
    }
    .badge-function { background-color: #28a745; color: white; }
    .badge-class { background-color: #17a2b8; color: white; }
    .badge-variable { background-color: #ffc107; color: #333; }
    .badge-type { background-color: #6f42c1; color: white; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .stat-card {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    }
    .stat-card h3 {
      color: #007bff;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .stat-card .value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #6c757d;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Code Analysis Report</h1>

    <div class="section">
      <h2>Language Statistics</h2>
      <div class="stats-grid">
        ${result.languageStats
          .map(
            (stat) => `
          <div class="stat-card">
            <h3>${stat.language.toUpperCase()}</h3>
            <div class="value">${stat.count}</div>
            <div>${stat.percentage.toFixed(1)}%</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <div class="section">
      <h2>Duplicate Code (${result.duplicateCodes.length})</h2>
      ${
        result.duplicateCodes.length === 0
          ? '<div class="empty-state">No duplicate code found</div>'
          : result.duplicateCodes
              .map(
                (dup, index) => `
        <div class="duplicate-item">
          <h3>Duplicate #${index + 1}</h3>
          <div class="code-block">${this.escapeHtml(dup.code)}</div>
          <div style="margin-top: 15px;">
            <strong>Found in ${dup.locations.length} locations:</strong>
            ${dup.locations
              .map(
                (loc) => `
              <div class="location">
                <span class="location-path">${loc.filePath}</span>
                <span class="location-line">Lines ${loc.startLine}-${loc.endLine}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
              )
              .join('')
      }
    </div>

    <div class="section">
      <h2>Unused Exports (${result.unusedCodes.length})</h2>
      ${
        result.unusedCodes.length === 0
          ? '<div class="empty-state">No unused exports found</div>'
          : `
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            ${result.unusedCodes
              .map(
                (unused) => `
              <tr>
                <td>${unused.name}</td>
                <td><span class="badge badge-${unused.type}">${unused.type}</span></td>
                <td>
                  <span class="location-path">${unused.location.filePath}</span>
                  <span class="location-line">Lines ${unused.location.startLine}-${unused.location.endLine}</span>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
      }
    </div>
  </div>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
