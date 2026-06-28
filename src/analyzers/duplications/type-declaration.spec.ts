import { describe, it, expect } from "vitest";
import { tsLanguage } from "../../languages/ts.js";
import { runAnalyzer } from "../../test-utils/index.js";
import { typeDeclaration } from "./type-declaration.js";

describe("typeDeclaration", () => {
  describe("valid", () => {
    it("different type structures", async () => {
      const reports = await runAnalyzer(typeDeclaration, [
        { filePath: "a.ts", code: "type A = string;", language: tsLanguage },
        { filePath: "b.ts", code: "type B = number;", language: tsLanguage },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("same structure in one file", async () => {
      const reports = await runAnalyzer(typeDeclaration, [
        {
          filePath: "a.ts",
          code: "type A = string; type B = string;",
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("same name but different structure", async () => {
      const reports = await runAnalyzer(typeDeclaration, [
        { filePath: "a.ts", code: "type A = string;", language: tsLanguage },
        { filePath: "b.ts", code: "type A = number;", language: tsLanguage },
      ]);
      expect(reports).toHaveLength(0);
    });
  });

  describe("invalid", () => {
    it("identical type aliases in two files", async () => {
      const reports = await runAnalyzer(typeDeclaration, [
        { filePath: "a.ts", code: "type A = string;", language: tsLanguage },
        { filePath: "b.ts", code: "type B = string;", language: tsLanguage },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe("Duplicate type declaration `A`");
      expect(reports[0].locations).toHaveLength(2);
    });

    it("union types with same members in different order", async () => {
      const reports = await runAnalyzer(typeDeclaration, [
        {
          filePath: "a.ts",
          code: 'type A = "a" | "b" | "c";',
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: 'type B = "c" | "a" | "b";',
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
    });

    it("object types with members in different order", async () => {
      const reports = await runAnalyzer(typeDeclaration, [
        {
          filePath: "a.ts",
          code: "type A = { x: number; y: string; };",
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: "type B = { y: string; x: number; };",
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
    });

    it("intersection types with members in different order", async () => {
      const reports = await runAnalyzer(typeDeclaration, [
        { filePath: "a.ts", code: "type A = Foo & Bar;", language: tsLanguage },
        { filePath: "b.ts", code: "type B = Bar & Foo;", language: tsLanguage },
      ]);
      expect(reports).toHaveLength(1);
    });
  });
});
