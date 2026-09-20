import { describe, it, expect } from "vitest";
import { collectCssFeatures } from "./css-scanner.js";

describe("collectCssFeatures", () => {
  it("collects a css property and its value", () => {
    const features = collectCssFeatures(
      ".card { display: grid; }",
      "/project/style.css",
      false,
    );
    expect(features).toContainEqual(
      expect.objectContaining({ kind: "css-property", name: "display" }),
    );
    expect(features).toContainEqual(
      expect.objectContaining({
        kind: "css-value",
        name: "display",
        value: "grid",
      }),
    );
  });

  it("collects an at-rule", () => {
    const features = collectCssFeatures(
      "@container (min-width: 400px) { .card { color: red; } }",
      "/project/style.css",
      false,
    );
    expect(features).toContainEqual(
      expect.objectContaining({ kind: "css-at-rule", name: "container" }),
    );
  });

  it("ignores custom properties and scss variables", () => {
    const features = collectCssFeatures(
      ".card { --foo: 1; $bar: 2; }",
      "/project/style.scss",
      true,
    );
    expect(features.some((f) => f.name === "--foo" || f.name === "$bar")).toBe(
      false,
    );
  });

  it("skips scss control directives as at-rules", () => {
    const features = collectCssFeatures(
      "@if true { .card { color: red; } }",
      "/project/style.scss",
      true,
    );
    expect(
      features.some((f) => f.kind === "css-at-rule" && f.name === "if"),
    ).toBe(false);
  });
});
