import { regexLiteral } from "./regex-literal.js";
import { urlString } from "./url-string.js";
import { typeAliasDeclaration } from "./type-alias-declaration.js";
import { typeAnnotation } from "./type-annotation.js";
import { enumDeclaration } from "./enum-declaration.js";

export const collectors = {
  regexLiteral,
  urlString,
  typeAliasDeclaration,
  typeAnnotation,
  enumDeclaration,
};

export type { Collector } from "./types.js";
export { CollectorContext } from "./context/index.js";
