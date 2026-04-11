import { regexLiteral } from "./collectors/regex-literal.js";
import { templateInterpolation } from "./collectors/template-interpolation.js";
import { throwWithString } from "./collectors/throw-with-string.js";
import { typeAlias } from "./collectors/type-alias.js";
import { inlineTypeUsage } from "./collectors/inline-type-usage.js";
import { enumDeclaration } from "./collectors/enum-declaration.js";
import { arrayLiteral } from "./collectors/array-literal.js";
import { urlString } from "./collectors/url-string.js";

export const collectors = {
  regexLiteral,
  templateInterpolation,
  throwWithString,
  typeAlias,
  inlineTypeUsage,
  enumDeclaration,
  arrayLiteral,
  urlString,
};

export type { Collector } from "./types.js";
export { CollectorContext } from "./context/index.js";
