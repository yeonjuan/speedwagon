import { regexLiteral } from "./regex-literal.js";
import { urlString } from "./url-string.js";
import { typeAliasDeclaration } from "./type-alias-declaration.js";

export const collectors = {
  regexLiteral,
  urlString,
  typeAliasDeclaration,
};

export type { Collector } from "./types.js";
export { CollectorContext } from "./context/index.js";
