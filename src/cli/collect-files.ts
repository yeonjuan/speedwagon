import fg from "fast-glob";
import ignore, { type Ignore } from "ignore";
import fs from "node:fs/promises";
import path from "node:path";

type GitignoreMatcher = {
  basePath: string;
  matcher: Ignore;
};

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
  const gitignoreMatchers = useGitignore
    ? await buildGitignoreMatchers(cwd)
    : [];
  const customIg = ignore();

  if (ignorePatterns.length > 0) {
    customIg.add(ignorePatterns);
  }

  const files = await fg(patterns, { cwd, absolute: true });

  return files.filter((file) => {
    const relativePath = toPosixPath(path.relative(cwd, file));

    if (isGitignored(relativePath, gitignoreMatchers)) {
      return false;
    }

    return !customIg.ignores(relativePath);
  });
}

async function buildGitignoreMatchers(
  cwd: string,
): Promise<GitignoreMatcher[]> {
  const gitignoreFiles = await fg([".gitignore", "**/.gitignore"], {
    cwd,
    absolute: true,
    dot: true,
  });
  const matchers: GitignoreMatcher[] = [];
  const sortedGitignoreFiles = gitignoreFiles.sort((a, b) => {
    const aPath = toPosixPath(path.relative(cwd, path.dirname(a)));
    const bPath = toPosixPath(path.relative(cwd, path.dirname(b)));
    return (
      getPathDepth(aPath) - getPathDepth(bPath) || aPath.localeCompare(bPath)
    );
  });

  for (const gitignoreFile of sortedGitignoreFiles) {
    try {
      const content = await fs.readFile(gitignoreFile, "utf-8");
      const basePath = toPosixPath(
        path.relative(cwd, path.dirname(gitignoreFile)),
      );

      if (
        basePath &&
        isGitignored(path.posix.join(basePath, ".gitignore"), matchers)
      ) {
        continue;
      }

      matchers.push({
        basePath,
        matcher: ignore().add(content),
      });
    } catch {}
  }

  return matchers;
}

function isGitignored(
  relativePath: string,
  matchers: GitignoreMatcher[],
): boolean {
  let ignored = false;

  for (const { basePath, matcher } of matchers) {
    const scopedPath = getScopedPath(relativePath, basePath);

    if (!scopedPath) {
      continue;
    }

    const result = matcher.test(scopedPath);

    if (result.ignored) {
      ignored = true;
    }

    if (result.unignored) {
      ignored = false;
    }
  }

  return ignored;
}

function getScopedPath(relativePath: string, basePath: string): string | null {
  if (!basePath) {
    return relativePath;
  }

  if (relativePath === basePath) {
    return ".";
  }

  if (!relativePath.startsWith(`${basePath}/`)) {
    return null;
  }

  return relativePath.slice(basePath.length + 1);
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}

function getPathDepth(filePath: string): number {
  if (!filePath) {
    return 0;
  }

  return filePath.split(path.posix.sep).length;
}
