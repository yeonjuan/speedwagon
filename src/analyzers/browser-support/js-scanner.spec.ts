import { describe, it, expect } from "vitest";
import { tsLanguage } from "../../languages/ts.js";
import { collectJsFeatures } from "./js-scanner.js";

async function scan(code: string) {
  const filePath = "/project/index.ts";
  const program = await tsLanguage.parse(code, filePath);
  return collectJsFeatures(program, code, filePath);
}

describe("collectJsFeatures", () => {
  it("collects a member expression", async () => {
    const features = await scan("Promise.allSettled([]);");
    expect(features).toContainEqual(
      expect.objectContaining({
        kind: "member",
        object: "Promise",
        name: "allSettled",
      }),
    );
  });

  it("collects a new expression", async () => {
    const features = await scan("new IntersectionObserver(() => {});");
    expect(features).toContainEqual(
      expect.objectContaining({ kind: "new", name: "IntersectionObserver" }),
    );
  });

  it("collects a bare identifier", async () => {
    const features = await scan("structuredClone({});");
    expect(features).toContainEqual(
      expect.objectContaining({ kind: "identifier", name: "structuredClone" }),
    );
  });

  it("normalizes window/globalThis aliases to a bare identifier", async () => {
    const features = await scan("window.fetch('/x'); globalThis.fetch('/y');");
    const fetchFeatures = features.filter((f) => f.name === "fetch");
    expect(fetchFeatures).toHaveLength(1);
    expect(fetchFeatures[0]).toMatchObject({
      kind: "identifier",
      object: null,
    });
  });

  it("does not flag a locally declared name shadowing a global", async () => {
    const features = await scan("function fetch(x) { return x; }\nfetch(1);");
    expect(features.some((f) => f.name === "fetch")).toBe(false);
  });

  it("treats a member access on a shadowed receiver as an unknown receiver", async () => {
    const features = await scan("const arr = []; arr.at(-1);");
    expect(features).toContainEqual(
      expect.objectContaining({ kind: "member", object: null, name: "at" }),
    );
  });

  it("ignores identifiers used only in type positions", async () => {
    const features = await scan(
      "function f(x: Promise<number>): Promise<number> { return x; }",
    );
    expect(features.some((f) => f.name === "Promise")).toBe(false);
  });

  it("does not flag an object literal property key", async () => {
    const features = await scan("const obj = { fetch: 1 };");
    expect(features.some((f) => f.name === "fetch")).toBe(false);
  });
});
