import { regexLiteral } from "./regex-literal.js";
import { urlString } from "./url-string.js";
import { typeAliasDeclaration } from "./type-alias-declaration.js";
import { typeAnnotation } from "./type-annotation.js";
import { enumDeclaration } from "./enum-declaration.js";
import { interfaceDeclaration } from "./interface-declaration.js";
import { stringInterpolation } from "./string-interpolation.js";
import { cognitiveComplexity } from "./cognitive-complexity.js";

export const collectors = {
  regexLiteral,
  urlString,
  typeAliasDeclaration,
  typeAnnotation,
  enumDeclaration,
  interfaceDeclaration,
  stringInterpolation,
  cognitiveComplexity,
};

export type { Collector } from "./types.js";
export { CollectorContext } from "./context/index.js";
