import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import type { ProjectContext, PackageInfo } from "./types.js";

export async function detectProject(cwd: string): Promise<ProjectContext> {
  const packages = await detectMonorepoPackages(cwd);
  return {
    rootPath: cwd,
    ...(packages && { monorepo: { packages } }),
  };
}

async function detectMonorepoPackages(
  cwd: string,
): Promise<PackageInfo[] | undefined> {
  const patterns = await getWorkspacePatterns(cwd);
  if (!patterns || patterns.length === 0) return undefined;

  const pkgJsonPaths = await fg(
    patterns.map((p) => `${p}/package.json`),
    { cwd, absolute: true, ignore: ["**/node_modules/**"] },
  );

  const packages: PackageInfo[] = [];
  for (const pkgJsonPath of pkgJsonPaths) {
    try {
      const content = JSON.parse(await fs.readFile(pkgJsonPath, "utf-8")) as {
        name?: string;
      };
      packages.push({
        name: content.name ?? path.basename(path.dirname(pkgJsonPath)),
        rootPath: path.dirname(pkgJsonPath),
      });
    } catch {}
  }

  return packages.length > 0 ? packages : undefined;
}

async function getWorkspacePatterns(
  cwd: string,
): Promise<string[] | undefined> {
  // npm / yarn workspaces
  try {
    const pkgJson = JSON.parse(
      await fs.readFile(path.join(cwd, "package.json"), "utf-8"),
    ) as { workspaces?: string[] | { packages?: string[] } };
    if (pkgJson.workspaces) {
      return Array.isArray(pkgJson.workspaces)
        ? pkgJson.workspaces
        : (pkgJson.workspaces.packages ?? []);
    }
  } catch {}

  // pnpm workspaces
  try {
    const content = await fs.readFile(
      path.join(cwd, "pnpm-workspace.yaml"),
      "utf-8",
    );
    const patterns = parsePnpmWorkspacePatterns(content);
    if (patterns.length > 0) return patterns;
  } catch {}

  // lerna
  try {
    const content = JSON.parse(
      await fs.readFile(path.join(cwd, "lerna.json"), "utf-8"),
    ) as { packages?: string[] };
    if (content.packages) return content.packages;
  } catch {}

  return undefined;
}

function parsePnpmWorkspacePatterns(content: string): string[] {
  const patterns: string[] = [];
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*-\s*['"]?([^'"#\s]+)['"]?/);
    if (match) patterns.push(match[1]);
  }
  return patterns;
}
