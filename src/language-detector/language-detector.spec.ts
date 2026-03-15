import { describe, it, expect } from "vitest";
import { LanguageDetector } from "./language-detector.js";

describe("LanguageDetector", () => {
  describe("detect", () => {
    it("should detect .js files", () => {
      expect(LanguageDetector.detect("file.js")).toBe("js");
      expect(LanguageDetector.detect("path/to/file.js")).toBe("js");
      expect(LanguageDetector.detect("/absolute/path/to/file.js")).toBe("js");
    });

    it("should detect .jsx files", () => {
      expect(LanguageDetector.detect("file.jsx")).toBe("jsx");
      expect(LanguageDetector.detect("path/to/file.jsx")).toBe("jsx");
    });

    it("should detect .ts files", () => {
      expect(LanguageDetector.detect("file.ts")).toBe("ts");
      expect(LanguageDetector.detect("path/to/file.ts")).toBe("ts");
    });

    it("should detect .tsx files", () => {
      expect(LanguageDetector.detect("file.tsx")).toBe("tsx");
      expect(LanguageDetector.detect("path/to/file.tsx")).toBe("tsx");
    });

    it("should handle uppercase extensions", () => {
      expect(LanguageDetector.detect("file.JS")).toBe("js");
      expect(LanguageDetector.detect("file.TS")).toBe("ts");
      expect(LanguageDetector.detect("file.JSX")).toBe("jsx");
      expect(LanguageDetector.detect("file.TSX")).toBe("tsx");
    });

    it("should return undefined for unknown extensions", () => {
      expect(LanguageDetector.detect("file.py")).toBeUndefined();
      expect(LanguageDetector.detect("file.txt")).toBeUndefined();
      expect(LanguageDetector.detect("file")).toBeUndefined();
    });

    it("should handle files with multiple dots", () => {
      expect(LanguageDetector.detect("file.config.ts")).toBe("ts");
      expect(LanguageDetector.detect("file.test.js")).toBe("js");
    });
  });
});
