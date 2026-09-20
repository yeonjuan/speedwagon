import { describe, it, expect } from "vitest";
import { matchFeatures } from "./bcd-mapper.js";
import type { BrowserTarget, FoundFeature } from "./types.js";

function feature(partial: Partial<FoundFeature>): FoundFeature {
  return {
    kind: "member",
    filePath: "/project/index.ts",
    line: 1,
    column: 0,
    object: null,
    name: "",
    ...partial,
  };
}

function target(browserslistName: string, version: string): BrowserTarget {
  return { browserslistName, bcdName: browserslistName, version };
}

describe("matchFeatures", () => {
  it("flags a member feature unsupported by an old target", () => {
    const { conflicts } = matchFeatures(
      [feature({ kind: "member", object: "Array", name: "at" })],
      [target("chrome", "60")],
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].browsers).toContainEqual(
      expect.objectContaining({ browser: "chrome", requiredVersion: "92" }),
    );
  });

  it("does not flag a feature already supported by the target", () => {
    const { conflicts } = matchFeatures(
      [feature({ kind: "member", object: "Array", name: "at" })],
      [target("chrome", "100")],
    );
    expect(conflicts).toHaveLength(0);
  });

  it("flags a css property/value unsupported by an old target", () => {
    const { conflicts } = matchFeatures(
      [feature({ kind: "css-property", name: "aspect-ratio" })],
      [target("ie", "11")],
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].feature).toBe("aspect-ratio");
  });

  it("does not count an unmatched feature as matched", () => {
    const { conflicts, matchedFeatureCount } = matchFeatures(
      [feature({ kind: "identifier", name: "totallyNotARealGlobalApi" })],
      [target("chrome", "1")],
    );
    expect(conflicts).toHaveLength(0);
    expect(matchedFeatureCount).toBe(0);
  });

  it("only flags an unknown-receiver member when every candidate interface fails", () => {
    const { conflicts } = matchFeatures(
      [feature({ kind: "member", object: null, name: "map" })],
      [target("chrome", "1")],
    );
    expect(conflicts).toHaveLength(0);
  });
});
