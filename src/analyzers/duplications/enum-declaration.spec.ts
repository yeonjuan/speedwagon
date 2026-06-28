import { describe, it, expect } from "vitest";
import { tsLanguage } from "../../languages/ts.js";
import { runAnalyzer } from "../../test-utils/index.js";
import { enumDeclaration } from "./enum-declaration.js";

describe("enumDeclaration", () => {
  describe("valid", () => {
    it("different enum members", async () => {
      const reports = await runAnalyzer(enumDeclaration, [
        {
          filePath: "a.ts",
          code: "enum A { X = 'X' }",
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: "enum B { Y = 'Y' }",
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("same members in one file", async () => {
      const reports = await runAnalyzer(enumDeclaration, [
        {
          filePath: "a.ts",
          code: "enum A { X = 'X' } enum B { X = 'X' }",
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("same name but different members", async () => {
      const reports = await runAnalyzer(enumDeclaration, [
        {
          filePath: "a.ts",
          code: "enum Status { Active = 'active' }",
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: "enum Status { Inactive = 'inactive' }",
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });
  });

  describe("invalid", () => {
    it("identical enums in two files", async () => {
      const reports = await runAnalyzer(enumDeclaration, [
        {
          filePath: "a.ts",
          code: "enum Status { A = 'A', B = 'B' }",
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: "enum Status { A = 'A', B = 'B' }",
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe("Duplicate enum declaration `Status`");
      expect(reports[0].locations).toHaveLength(2);
    });

    it("identical members with different enum names", async () => {
      const reports = await runAnalyzer(enumDeclaration, [
        {
          filePath: "a.ts",
          code: "enum A { X = 1, Y = 2 }",
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: "enum B { X = 1, Y = 2 }",
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
    });

    it("enums without initializers", async () => {
      const reports = await runAnalyzer(enumDeclaration, [
        {
          filePath: "a.ts",
          code: "enum Dir { Up, Down, Left, Right }",
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: "enum Direction { Up, Down, Left, Right }",
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
    });
  });
});
