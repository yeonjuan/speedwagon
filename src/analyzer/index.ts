import { FileInfo, LanguageStats } from '../types';

export class LanguageAnalyzer {
  analyze(fileInfos: FileInfo[]): LanguageStats[] {
    const languageCounts = new Map<string, number>();
    const totalFiles = fileInfos.length;

    for (const fileInfo of fileInfos) {
      const count = languageCounts.get(fileInfo.language) || 0;
      languageCounts.set(fileInfo.language, count + 1);
    }

    const stats: LanguageStats[] = [];
    for (const [language, count] of languageCounts.entries()) {
      stats.push({
        language: language as any,
        count,
        percentage: (count / totalFiles) * 100,
      });
    }

    return stats.sort((a, b) => b.count - a.count);
  }
}
