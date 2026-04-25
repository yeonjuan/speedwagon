import { regexLiteral } from "./regex-literal.js";
import { urlString } from "./url-string.js";
import { typeAliasDeclaration } from "./type-alias-declaration.js";
import { typeAnnotation } from "./type-annotation.js";
import { enumDeclaration } from "./enum-declaration.js";
import { interfaceDeclaration } from "./interface-declaration.js";
import { stringInterpolation } from "./string-interpolation.js";
import { cognitiveComplexity } from "./cognitive-complexity.js";
import { cyclomaticComplexity } from "./cyclomatic-complexity.js";
import { functionBody } from "./function-body.js";
import { magicNumber } from "./magic-number.js";

export const collectors = {
  regexLiteral,
  urlString,
  typeAliasDeclaration,
  typeAnnotation,
  enumDeclaration,
  interfaceDeclaration,
  stringInterpolation,
  cognitiveComplexity,
  cyclomaticComplexity,
  functionBody,
  magicNumber,
};

export type { Collector } from "./types.js";
export { CollectorContext } from "./context/index.js";
