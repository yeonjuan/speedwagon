#!/usr/bin/env node

import { Command } from 'commander';
import { FileTraverser } from './traverser';
import { CodeParser } from './parser';
import { LanguageAnalyzer } from './analyzer';
import { DuplicateDetector } from './detector/duplicate';
import { UnusedCodeDetector } from './detector/unused';
import { Reporter } from './reporter';
import { AnalysisResult } from './types';

const program = new Command();

program
  .name('code-analyzer')
  .description('Analyze code for language usage, duplicates, and unused exports')
  .version('1.0.0')
  .argument('<patterns...>', 'File patterns to analyze (e.g., **/*.{js,ts,jsx,tsx})')
  .option('-o, --output <path>', 'Output file path', './report')
  .option('-f, --format <type>', 'Report format (json or html)', 'html')
  .action(async (patterns: string[], options) => {
    try {
      console.log('Starting code analysis...\n');

      const traverser = new FileTraverser();
      const parser = new CodeParser();
      const languageAnalyzer = new LanguageAnalyzer();
      const duplicateDetector = new DuplicateDetector();
      const unusedCodeDetector = new UnusedCodeDetector();
      const reporter = new Reporter();

      console.log(`Scanning files matching patterns: ${patterns.join(', ')}`);
      const fileEntries = await traverser.traverse({ patterns });
      console.log(`Found ${fileEntries.length} files\n`);

      if (fileEntries.length === 0) {
        console.log('No files found matching the patterns');
        return;
      }

      console.log('Parsing files...');
      const fileInfos = parser.parseMany(fileEntries);
      console.log('Parsing completed\n');

      console.log('Analyzing languages...');
      const languageStats = languageAnalyzer.analyze(fileInfos);
      console.log('Language analysis completed');
      languageStats.forEach((stat) => {
        console.log(`  - ${stat.language}: ${stat.count} files (${stat.percentage.toFixed(1)}%)`);
      });
      console.log('');

      console.log('Detecting duplicate code...');
      const duplicateCodes = duplicateDetector.detect(fileInfos);
      console.log(`Found ${duplicateCodes.length} duplicate code blocks\n`);

      console.log('Detecting unused exports...');
      const unusedCodes = unusedCodeDetector.detect(fileInfos);
      console.log(`Found ${unusedCodes.length} unused exports\n`);

      const result: AnalysisResult = {
        languageStats,
        duplicateCodes,
        unusedCodes,
      };

      const outputPath = options.format === 'json'
        ? `${options.output}.json`
        : `${options.output}.html`;

      reporter.generate(result, {
        format: options.format,
        outputPath,
      });

      console.log('\nAnalysis completed successfully!');
    } catch (error) {
      console.error('Error during analysis:', error);
      process.exit(1);
    }
  });

program.parse();
