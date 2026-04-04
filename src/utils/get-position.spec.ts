import { describe, it, expect } from "vitest";
import { getPosition } from "./get-position.js";

describe("getPosition", () => {
  it("should return position for offset 0", () => {
    const input = "hello world";
    const result = getPosition(input, 0);

    expect(result).toEqual({
      line: 1,
      column: 0,
    });
  });

  it("should return position for middle of first line", () => {
    const input = "hello world";
    const result = getPosition(input, 6);

    expect(result).toEqual({
      line: 1,
      column: 6,
    });
  });

  it("should return position for single line feed", () => {
    const input = "hello\nworld";
    const result = getPosition(input, 6);

    expect(result).toEqual({
      line: 2,
      column: 0,
    });
  });

  it("should return position for second line", () => {
    const input = "hello\nworld";
    const result = getPosition(input, 8);

    expect(result).toEqual({
      line: 2,
      column: 2,
    });
  });

  it("should handle multiple lines", () => {
    const input = "line1\nline2\nline3";
    const result = getPosition(input, 12);

    expect(result).toEqual({
      line: 3,
      column: 0,
    });
  });

  it("should handle CRLF line endings", () => {
    const input = "hello\r\nworld";
    const result = getPosition(input, 7);

    expect(result).toEqual({
      line: 2,
      column: 0,
    });
  });

  it("should handle mixed line endings", () => {
    const input = "line1\nline2\r\nline3";
    const result = getPosition(input, 13);

    expect(result).toEqual({
      line: 3,
      column: 0,
    });
  });

  it("should handle carriage return only", () => {
    const input = "hello\rworld";
    const result = getPosition(input, 6);

    expect(result).toEqual({
      line: 2,
      column: 0,
    });
  });

  it("should handle line separator (U+2028)", () => {
    const input = "hello\u2028world";
    const result = getPosition(input, 6);

    expect(result).toEqual({
      line: 2,
      column: 0,
    });
  });

  it("should handle paragraph separator (U+2029)", () => {
    const input = "hello\u2029world";
    const result = getPosition(input, 6);

    expect(result).toEqual({
      line: 2,
      column: 0,
    });
  });

  it("should handle empty string", () => {
    const input = "";
    const result = getPosition(input, 0);

    expect(result).toEqual({
      line: 1,
      column: 0,
    });
  });

  it("should handle multiline code example", () => {
    const input = `function test() {
  return 42;
}`;
    const result = getPosition(input, 20);

    expect(result).toEqual({
      line: 2,
      column: 2,
    });
  });

  it("should handle offset at end of line", () => {
    const input = "hello\nworld";
    const result = getPosition(input, 5);

    expect(result).toEqual({
      line: 1,
      column: 5,
    });
  });

  it("should handle long multiline text", () => {
    const input = `const x = 1;
const y = 2;
const z = 3;
console.log(x + y + z);`;

    const result = getPosition(input, 51);

    expect(result).toEqual({
      line: 4,
      column: 12,
    });
  });

  it("should handle Unicode characters", () => {
    const input = "hello 🌍\nworld";
    const result = getPosition(input, 9);

    expect(result).toEqual({
      line: 2,
      column: 0,
    });
  });
});
