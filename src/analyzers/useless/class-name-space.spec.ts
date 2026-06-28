import { describe, it, expect } from "vitest";
import { tsxLanguage } from "../../languages/tsx.js";
import { runUselessAnalyzer } from "../../test-utils/index.js";
import { classNameSpace } from "./class-name-space.js";

describe("classNameSpace", () => {
  describe("valid", () => {
    it("normal space-separated classes", async () => {
      const reports = await runUselessAnalyzer(classNameSpace, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className='foo bar'/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("single class", async () => {
      const reports = await runUselessAnalyzer(classNameSpace, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className='foo'/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("empty className", async () => {
      const reports = await runUselessAnalyzer(classNameSpace, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className=''/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("dynamic className is skipped", async () => {
      const reports = await runUselessAnalyzer(classNameSpace, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className={styles.foo}/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });
  });

  describe("invalid", () => {
    it("leading space", async () => {
      const reports = await runUselessAnalyzer(classNameSpace, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className=' foo'/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe("Unnecessary whitespace in `className`");
    });

    it("trailing space", async () => {
      const reports = await runUselessAnalyzer(classNameSpace, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className='foo '/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe("Unnecessary whitespace in `className`");
    });

    it("consecutive spaces", async () => {
      const reports = await runUselessAnalyzer(classNameSpace, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className='foo  bar'/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe("Unnecessary whitespace in `className`");
    });

    it("leading and trailing spaces", async () => {
      const reports = await runUselessAnalyzer(classNameSpace, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div className='  foo  bar  '/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
    });

    it("class attribute", async () => {
      const reports = await runUselessAnalyzer(classNameSpace, [
        {
          filePath: "a.tsx",
          code: "const A = () => <div class=' foo'/>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe("Unnecessary whitespace in `class`");
    });

    it("multiple elements with issues", async () => {
      const reports = await runUselessAnalyzer(classNameSpace, [
        {
          filePath: "a.tsx",
          code: "const A = () => <><div className=' foo'/><span className='bar '/></>;",
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(2);
    });
  });
});
