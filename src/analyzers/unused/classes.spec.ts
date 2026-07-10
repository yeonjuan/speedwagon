import { describe, it, expect } from "vitest";
import { tsxLanguage } from "../../languages/tsx.js";
import { tsLanguage } from "../../languages/ts.js";
import { cssModuleLanguage } from "../../languages/css.js";
import { scssModuleLanguage } from "../../languages/scss.js";
import { runUnusedAnalyzer } from "../../test-utils/index.js";
import { unusedClasses } from "./classes.js";

const CSS_PATH = "/project/Component.module.css";
const SCSS_PATH = "/project/Component.module.scss";
const JS_PATH = "/project/Component.tsx";

describe("unusedClasses", () => {
  describe("valid", () => {
    it("used class via dot notation", async () => {
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: CSS_PATH,
            content: ".foo { color: red; }",
            language: cssModuleLanguage,
          },
        ],
        [
          {
            filePath: JS_PATH,
            code: `import styles from './Component.module.css'; const A = () => <div className={styles.foo} />;`,
            language: tsxLanguage,
          },
        ],
      );
      expect(reports).toHaveLength(0);
    });

    it("used class via bracket notation", async () => {
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: CSS_PATH,
            content: ".foo-bar { color: red; }",
            language: cssModuleLanguage,
          },
        ],
        [
          {
            filePath: JS_PATH,
            code: `import styles from './Component.module.css'; const A = () => <div className={styles['foo-bar']} />;`,
            language: tsxLanguage,
          },
        ],
      );
      expect(reports).toHaveLength(0);
    });

    it("no CSS files", async () => {
      const reports = await runUnusedAnalyzer(unusedClasses, [], []);
      expect(reports).toHaveLength(0);
    });

    it("global class is excluded", async () => {
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: CSS_PATH,
            content: ":global(.foo) { color: red; }",
            language: cssModuleLanguage,
          },
        ],
        [],
      );
      expect(reports).toHaveLength(0);
    });

    it("scss module file", async () => {
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: SCSS_PATH,
            content: ".foo { color: red; }",
            language: scssModuleLanguage,
          },
        ],
        [
          {
            filePath: "/project/Component.tsx",
            code: `import styles from './Component.module.scss'; const A = () => <div className={styles.foo} />;`,
            language: tsxLanguage,
          },
        ],
      );
      expect(reports).toHaveLength(0);
    });

    it("namespace import", async () => {
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: CSS_PATH,
            content: ".foo { color: red; }",
            language: cssModuleLanguage,
          },
        ],
        [
          {
            filePath: JS_PATH,
            code: `import * as styles from './Component.module.css'; const A = () => <div className={styles.foo} />;`,
            language: tsxLanguage,
          },
        ],
      );
      expect(reports).toHaveLength(0);
    });

    it("non-css-module import is ignored", async () => {
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: CSS_PATH,
            content: ".foo { color: red; }",
            language: cssModuleLanguage,
          },
        ],
        [
          {
            filePath: "/project/Component.ts",
            code: `import styles from './Component.css'; const x = styles.foo;`,
            language: tsLanguage,
          },
        ],
      );
      expect(reports).toHaveLength(1);
    });

    it("scss nested class", async () => {
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: SCSS_PATH,
            content: ".parent { color: red; &.active { color: blue; } }",
            language: scssModuleLanguage,
          },
        ],
        [
          {
            filePath: "/project/Component.tsx",
            code: `import styles from './Component.module.scss'; const A = () => <div className={styles.parent + ' ' + styles.active} />;`,
            language: tsxLanguage,
          },
        ],
      );
      expect(reports).toHaveLength(0);
    });

    it("css comment class is not extracted", async () => {
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: CSS_PATH,
            content: "/* .commented { } */ .real { }",
            language: cssModuleLanguage,
          },
        ],
        [
          {
            filePath: JS_PATH,
            code: `import styles from './Component.module.css'; const A = () => <div className={styles.real} />;`,
            language: tsxLanguage,
          },
        ],
      );
      expect(reports).toHaveLength(0);
    });
  });

  describe("invalid", () => {
    it("unused class", async () => {
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: CSS_PATH,
            content: ".used { } .unused { }",
            language: cssModuleLanguage,
          },
        ],
        [
          {
            filePath: JS_PATH,
            code: `import styles from './Component.module.css'; const A = () => <div className={styles.used} />;`,
            language: tsxLanguage,
          },
        ],
      );
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain(".unused");
      expect(reports[0].location.filePath).toBe(CSS_PATH);
    });

    it("no JS files referencing the CSS module", async () => {
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: CSS_PATH,
            content: ".foo { color: red; }",
            language: cssModuleLanguage,
          },
        ],
        [],
      );
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain(".foo");
    });

    it("multiple unused classes", async () => {
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: CSS_PATH,
            content: ".a { } .b { } .c { }",
            language: cssModuleLanguage,
          },
        ],
        [
          {
            filePath: JS_PATH,
            code: `import styles from './Component.module.css'; const A = () => <div className={styles.a} />;`,
            language: tsxLanguage,
          },
        ],
      );
      expect(reports).toHaveLength(2);
      const messages = reports.map((r) => r.message);
      expect(messages.some((m) => m.includes(".b"))).toBe(true);
      expect(messages.some((m) => m.includes(".c"))).toBe(true);
    });

    it("class used in different CSS module is still unused", async () => {
      const otherCssPath = "/project/Other.module.css";
      const reports = await runUnusedAnalyzer(
        unusedClasses,
        [
          {
            filePath: CSS_PATH,
            content: ".foo { color: red; }",
            language: cssModuleLanguage,
          },
          {
            filePath: otherCssPath,
            content: ".foo { color: blue; }",
            language: cssModuleLanguage,
          },
        ],
        [
          {
            filePath: JS_PATH,
            code: `import styles from './Component.module.css'; const A = () => <div className={styles.foo} />;`,
            language: tsxLanguage,
          },
        ],
      );
      expect(reports).toHaveLength(1);
      expect(reports[0].location.filePath).toBe(otherCssPath);
    });
  });
});
