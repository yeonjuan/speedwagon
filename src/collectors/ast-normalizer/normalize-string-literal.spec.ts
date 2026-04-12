import { describe, test, expect } from "vitest";
import { parseSync, Visitor } from "oxc-parser";
import type { StringLiteral } from "oxc-parser";
import { normalizer } from "./index.js";

function extractStringLiteral(code: string): StringLiteral {
  const program = parseSync("test.js", code);
  let found: StringLiteral | null = null;
  new Visitor({
    Literal(node) {
      if (typeof node.value === "string") found = node as StringLiteral;
    },
  }).visit(program.program);
  if (!found) throw new Error(`No string literal found in: ${code}`);
  return found;
}

describe("normalizeStringLiteral", () => {
  test.each([
    `"https://example.com"`,
    `"http://example.com/path?query=1"`,
    `"hello"`,
    `"not-a-url"`,
    `""`,
  ])("%s", (code) => {
    const node = extractStringLiteral(`${code};`);
    expect(normalizer.normalizeStringLiteral(node)).toMatchSnapshot();
  });
});
