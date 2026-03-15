import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { collectFiles } from "./collect-files.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("collectFiles", () => {
  const testDir = path.join(__dirname, "__temp-fixtures__");

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should collect files matching glob patterns", async () => {
    await fs.writeFile(path.join(testDir, "file1.ts"), "");
    await fs.writeFile(path.join(testDir, "file2.ts"), "");
    await fs.writeFile(path.join(testDir, "file3.js"), "");

    const files = await collectFiles(["**/*.ts"], { cwd: testDir });

    expect(files).toHaveLength(2);
    expect(files.every((f) => f.endsWith(".ts"))).toBe(true);
  });

  it("should respect gitignore rules by default", async () => {
    await fs.writeFile(path.join(testDir, "file1.ts"), "");
    await fs.writeFile(path.join(testDir, "file2.ts"), "");
    await fs.writeFile(path.join(testDir, "ignored.ts"), "");
    await fs.writeFile(path.join(testDir, ".gitignore"), "ignored.ts");

    const files = await collectFiles(["**/*.ts"], { cwd: testDir });

    expect(files).toHaveLength(2);
    expect(files.some((f) => f.includes("ignored.ts"))).toBe(false);
  });

  it("should not apply gitignore when useGitignore is false", async () => {
    await fs.writeFile(path.join(testDir, "file1.ts"), "");
    await fs.writeFile(path.join(testDir, "ignored.ts"), "");
    await fs.writeFile(path.join(testDir, ".gitignore"), "ignored.ts");

    const files = await collectFiles(["**/*.ts"], {
      cwd: testDir,
      useGitignore: false,
    });

    expect(files).toHaveLength(2);
    expect(files.some((f) => f.includes("ignored.ts"))).toBe(true);
  });

  it("should return absolute paths", async () => {
    await fs.writeFile(path.join(testDir, "file1.ts"), "");

    const files = await collectFiles(["**/*.ts"], { cwd: testDir });

    expect(files[0]).toBe(path.join(testDir, "file1.ts"));
  });

  it("should handle multiple patterns", async () => {
    await fs.writeFile(path.join(testDir, "file1.ts"), "");
    await fs.writeFile(path.join(testDir, "file2.js"), "");

    const files = await collectFiles(["**/*.ts", "**/*.js"], { cwd: testDir });

    expect(files).toHaveLength(2);
  });

  it("should return empty array when no files match", async () => {
    const files = await collectFiles(["**/*.ts"], { cwd: testDir });

    expect(files).toHaveLength(0);
  });

  it("should respect nested gitignore files", async () => {
    const subDir = path.join(testDir, "sub");
    await fs.mkdir(subDir, { recursive: true });

    await fs.writeFile(path.join(testDir, "file1.ts"), "");
    await fs.writeFile(path.join(subDir, "file2.ts"), "");
    await fs.writeFile(path.join(subDir, "ignored.ts"), "");
    await fs.writeFile(path.join(subDir, ".gitignore"), "ignored.ts");

    const files = await collectFiles(["**/*.ts"], { cwd: testDir });

    expect(files).toHaveLength(2);
    expect(files.some((f) => f.includes("ignored.ts"))).toBe(false);
  });
});
