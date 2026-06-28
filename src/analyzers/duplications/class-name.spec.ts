import { describe, it, expect } from "vitest";
import { tsxLanguage } from "../../languages/tsx.js";
import { runAnalyzer } from "../../test-utils/index.js";
import { className } from "./class-name.js";

describe("className", () => {
  describe("valid", () => {
    it("no duplicate classes", async () => {
      const reports = await runAnalyzer(className, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className='a b c'/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("dynamic className is skipped", async () => {
      const reports = await runAnalyzer(className, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className={styles.foo}/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("empty className", async () => {
      const reports = await runAnalyzer(className, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className=''/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("same class in different elements does not report", async () => {
      const reports = await runAnalyzer(className, [
        {
          filePath: "a.tsx",
          code: "const A = () => <><div className='foo'/><span className='foo'/></>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });
  });

  describe("invalid", () => {
    it("duplicate class in className attribute", async () => {
      const reports = await runAnalyzer(className, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className='a b a'/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain("Duplicate class names");
      expect(reports[0].message).toContain("a");
      expect(reports[0].locations).toHaveLength(1);
    });

    it("duplicate class in class attribute", async () => {
      const reports = await runAnalyzer(className, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div class='x x'/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain("x");
    });

    it("multiple duplicate classes in one attribute", async () => {
      const reports = await runAnalyzer(className, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className='a a b b'/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain("a");
      expect(reports[0].message).toContain("b");
    });

    it("multiple elements each with duplicate classes", async () => {
      const reports = await runAnalyzer(className, [
        {
          filePath: "a.tsx",
          code: "const A = () => <><div className='a a'/><span className='b b'/></>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(2);
    });
  });
});
