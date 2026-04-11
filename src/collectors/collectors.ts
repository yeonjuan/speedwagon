import { regexLiteral } from "./regex-literal.js";
import { templateInterpolation } from "./template-interpolation.js";
import { throwWithString } from "./throw-with-string.js";
import { typeAlias } from "./type-alias.js";
import { inlineTypeUsage } from "./inline-type-usage.js";
import { enumDeclaration } from "./enum-declaration.js";

export const collectors = {
  regexLiteral,
  templateInterpolation,
  throwWithString,
  typeAlias,
  inlineTypeUsage,
  enumDeclaration,
};
