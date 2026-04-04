import fg from "fast-glob";
import ignore, { type Ignore } from "ignore";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Collect files matching the given glob patterns, respecting gitignore rules.
 * @param patterns - Glob patterns to match files
 * @param options - Collection options
 * @param options.cwd - Working directory (defaults to process.cwd())
 * @param options.useGitignore - Whether to respect .gitignore rules (defaults to true)
 * @returns Array of absolute file paths
 */
export async function collectFiles(
  patterns: string[],
  options: {
    cwd?: string;
    useGitignore?: boolean;
  } = {},
): Promise<string[]> {
  const { cwd = process.cwd(), useGitignore = true } = options;

  const ig = ignore();

  if (useGitignore) {
    const gitIg = await buildIgnoreFilter(cwd);
    ig.add(gitIg);
  }

  const files = await fg(patterns, { cwd, absolute: true });

  return files.filter((f) => !ig.ignores(path.relative(cwd, f)));
}

async function buildIgnoreFilter(cwd: string): Promise<Ignore> {
  const ig = ignore();

  const gitignoreFiles = await fg([".gitignore", "**/.gitignore"], {
    cwd,
    absolute: true,
    dot: true,
  });

  for (const gitignoreFile of gitignoreFiles) {
    try {
      const content = await fs.readFile(gitignoreFile, "utf-8");
      ig.add(content);
    } catch {}
  }

  return ig;
}
