import { describe, it, expect } from "vitest";
import { tsLanguage } from "../../languages/ts.js";
import { jsLanguage } from "../../languages/js.js";
import { tsxLanguage } from "../../languages/tsx.js";
import { jsxLanguage } from "../../languages/jsx.js";
import { runAnalyzer } from "../../test-utils/index.js";
import { hardcodedUrl } from "./hardcoded-url.js";

describe("hardcodedUrl", () => {
  describe("valid", () => {
    it("single file with one URL", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.ts",
          code: `const url = "https://example.com";`,
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("different URLs in two files", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.ts",
          code: `const url = "https://example.com";`,
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: `const url = "https://other.com";`,
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("same URL used multiple times in one file", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.ts",
          code: `const a = "https://example.com"; const b = "https://example.com";`,
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("non-URL string literals are not detected", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.ts",
          code: `const s = "hello world";`,
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: `const s = "hello world";`,
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("string containing a URL but not a pure URL is not detected", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.ts",
          code: `const s = "visit https://example.com here";`,
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: `const s = "visit https://example.com here";`,
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });
  });

  describe("invalid", () => {
    it("same URL string literal in two files", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.ts",
          code: `const url = "https://example.com/api";`,
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: `const url = "https://example.com/api";`,
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe(
        "Duplicate hardcoded URL `https://example.com/api`",
      );
      expect(reports[0].locations).toHaveLength(2);
    });

    it("http:// URL also detected", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.ts",
          code: `const url = "http://example.com";`,
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: `const url = "http://example.com";`,
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
    });

    it("same URL in three files reports one item with three locations", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.ts",
          code: `const url = "https://api.example.com/v1";`,
          language: tsLanguage,
        },
        {
          filePath: "b.ts",
          code: `const url = "https://api.example.com/v1";`,
          language: tsLanguage,
        },
        {
          filePath: "c.ts",
          code: `const url = "https://api.example.com/v1";`,
          language: tsLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].locations).toHaveLength(3);
    });

    it("URL in JSX attribute value", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.tsx",
          code: `const A = () => <a href="https://example.com">link</a>;`,
          language: tsxLanguage,
        },
        {
          filePath: "b.tsx",
          code: `const B = () => <a href="https://example.com">link</a>;`,
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe(
        "Duplicate hardcoded URL `https://example.com`",
      );
    });

    it("URL as JSX children text", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.tsx",
          code: `const A = () => <a>https://example.com</a>;`,
          language: tsxLanguage,
        },
        {
          filePath: "b.tsx",
          code: `const B = () => <a>https://example.com</a>;`,
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe(
        "Duplicate hardcoded URL `https://example.com`",
      );
    });

    it("URL in JSX attribute in jsx file", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.jsx",
          code: `const A = () => <img src="https://cdn.example.com/logo.png" />;`,
          language: jsxLanguage,
        },
        {
          filePath: "b.jsx",
          code: `const B = () => <img src="https://cdn.example.com/logo.png" />;`,
          language: jsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
    });

    it("same URL across ts and tsx files", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.ts",
          code: `const API = "https://api.example.com";`,
          language: tsLanguage,
        },
        {
          filePath: "b.tsx",
          code: `const B = () => <a href="https://api.example.com">link</a>;`,
          language: tsxLanguage,
        },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].locations).toHaveLength(2);
    });
  });

  describe("valid", () => {
    it("same URL across js and ts files is not detected (different language family)", async () => {
      const reports = await runAnalyzer(hardcodedUrl, [
        {
          filePath: "a.ts",
          code: `const url = "https://example.com";`,
          language: tsLanguage,
        },
        {
          filePath: "b.js",
          code: `const url = "https://example.com";`,
          language: jsLanguage,
        },
      ]);
      expect(reports).toHaveLength(0);
    });
  });
});
