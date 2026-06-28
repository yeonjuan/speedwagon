import { describe, it, expect } from "vitest";
import { tsLanguage } from "../../languages/ts.js";
import { jsLanguage } from "../../languages/js.js";
import { runAnalyzer } from "../../test-utils/index.js";
import { regex } from "./regex.js";

describe("regex", () => {
  describe("valid", () => {
    it("single file with one regex", async () => {
      const reports = await runAnalyzer(regex, [
        { filePath: "a.ts", code: "const x = /foo/;", language: tsLanguage },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("different regexes in two files", async () => {
      const reports = await runAnalyzer(regex, [
        { filePath: "a.ts", code: "/foo/;", language: tsLanguage },
        { filePath: "b.ts", code: "/bar/;", language: tsLanguage },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("same regex used multiple times in one file", async () => {
      const reports = await runAnalyzer(regex, [
        { filePath: "a.ts", code: "/foo/; /foo/;", language: tsLanguage },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("same regex in different language files", async () => {
      const reports = await runAnalyzer(regex, [
        { filePath: "a.ts", code: "/foo/;", language: tsLanguage },
        { filePath: "b.js", code: "/foo/;", language: jsLanguage },
      ]);
      expect(reports).toHaveLength(0);
    });

    it("same pattern with different flags", async () => {
      const reports = await runAnalyzer(regex, [
        { filePath: "a.ts", code: "/foo/i;", language: tsLanguage },
        { filePath: "b.ts", code: "/foo/g;", language: tsLanguage },
      ]);
      expect(reports).toHaveLength(0);
    });
  });

  describe("invalid", () => {
    it("same regex in two files", async () => {
      const reports = await runAnalyzer(regex, [
        { filePath: "a.ts", code: "/foo/;", language: tsLanguage },
        { filePath: "b.ts", code: "/foo/;", language: tsLanguage },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe("Duplicate RegExp `/foo/`");
      expect(reports[0].locations).toHaveLength(2);
    });

    it("same regex with flags in two files (flag order normalized)", async () => {
      const reports = await runAnalyzer(regex, [
        { filePath: "a.ts", code: "/foo/gi;", language: tsLanguage },
        { filePath: "b.ts", code: "/foo/ig;", language: tsLanguage },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toBe("Duplicate RegExp `/foo/gi`");
    });

    it("same regex in three files reports one item with three locations", async () => {
      const reports = await runAnalyzer(regex, [
        { filePath: "a.ts", code: "/foo/;", language: tsLanguage },
        { filePath: "b.ts", code: "/foo/;", language: tsLanguage },
        { filePath: "c.ts", code: "/foo/;", language: tsLanguage },
      ]);
      expect(reports).toHaveLength(1);
      expect(reports[0].locations).toHaveLength(3);
    });
  });
});
