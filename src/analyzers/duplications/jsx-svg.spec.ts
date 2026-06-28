import { describe, it, expect } from "vitest";
import { tsxLanguage } from "../../languages/tsx.js";
import { runAnalyzer } from "../../test-utils/index.js";
import { jsxSvg } from "./jsx-svg.js";

describe("jsxSvg", () => {
  describe("valid", () => {
    it("different SVG content", async () => {
      const reports = await runAnalyzer(jsxSvg, [
        {
          filePath: "a.tsx",
          code: "const A = () => <svg><circle r={5} /></svg>;",
          language: tsxLanguage,
        },
        {
          filePath: "b.tsx",
          code: "const B = () => <svg><rect width={10} /></svg>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("non-svg JSX elements are not detected", async () => {
      const reports = await runAnalyzer(jsxSvg, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div><span>text</span></div>;",
          language: tsxLanguage,
        },
        {
          filePath: "b.tsx",
          code: "const B = () => <div><span>text</span></div>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("same SVG used multiple times in one file", async () => {
      const reports = await runAnalyzer(jsxSvg, [
        {
          filePath: "a.tsx",
          code: "const A = () => <svg><path d='M0 0'/></svg>; const B = () => <svg><path d='M0 0'/></svg>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });
  });

  describe("invalid", () => {
    it("identical SVGs in two files", async () => {
      const reports = await runAnalyzer(jsxSvg, [
        {
          filePath: "a.tsx",
          code: "const A = () => <svg viewBox='0 0 24 24'><path d='M0 0'/></svg>;",
          language: tsxLanguage,
        },
        {
          filePath: "b.tsx",
          code: "const B = () => <svg viewBox='0 0 24 24'><path d='M0 0'/></svg>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe("Duplicate JSX SVG component");
      expect(reports[0].locations).toHaveLength(2);
    });

    it("SVG with attributes in different order still matches", async () => {
      const reports = await runAnalyzer(jsxSvg, [
        {
          filePath: "a.tsx",
          code: "const A = () => <svg width='24' height='24'/>;",
          language: tsxLanguage,
        },
        {
          filePath: "b.tsx",
          code: "const B = () => <svg height='24' width='24'/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
    });
  });
});
