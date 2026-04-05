import fg from "fast-glob";
import ignore, { type Ignore } from "ignore";
import fs from "node:fs/promises";
import path from "node:path";
import { ENCODING_UTF8 } from "../constants.js";

export async function collectFiles(
  patterns: string[],
  options: {
    cwd?: string;
    useGitignore?: boolean;
    ignorePatterns?: string[];
  } = {},
): Promise<string[]> {
  const {
    cwd = process.cwd(),
    useGitignore = true,
    ignorePatterns = [],
  } = options;

  const ig = ignore();

  if (useGitignore) {
    const gitIg = await buildIgnoreFilter(cwd);
    ig.add(gitIg);
  }

  if (ignorePatterns.length > 0) {
    ig.add(ignorePatterns);
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
      const content = await fs.readFile(gitignoreFile, ENCODING_UTF8);
      ig.add(content);
    } catch {}
  }

  return ig;
}
