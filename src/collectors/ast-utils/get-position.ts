import type { Position } from "../../types/index.js";

const LINE_FEED = 10;
const CARRIAGE_RETURN = 13;
const LINE_SEPARATOR = 0x2028;
const PARAGRAPH_SEPARATOR = 0x2029;

function isNewLine(charCode: number): boolean {
  return (
    charCode === LINE_FEED ||
    charCode === CARRIAGE_RETURN ||
    charCode === LINE_SEPARATOR ||
    charCode === PARAGRAPH_SEPARATOR
  );
}

function findNextLineBreak(
  input: string,
  start: number,
  end: number = input.length,
): number {
  for (let i = start; i < end; i++) {
    const charCode = input.charCodeAt(i);

    if (!isNewLine(charCode)) {
      continue;
    }

    if (
      charCode === CARRIAGE_RETURN &&
      i < end - 1 &&
      input.charCodeAt(i + 1) === LINE_FEED
    ) {
      return i + 2;
    }

    return i + 1;
  }

  return -1;
}

export function getPosition(input: string, offset: number): Position {
  let line = 1;
  let currentPos = 0;

  while (true) {
    const nextBreak = findNextLineBreak(input, currentPos, offset);

    if (nextBreak < 0) {
      return {
        line,
        column: offset - currentPos + 1,
      };
    }

    line++;
    currentPos = nextBreak;
  }
}
