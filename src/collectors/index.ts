import { regexLiteral } from "./regex-literal.js";
import { urlString } from "./url-string.js";

export const collectors = {
  regexLiteral,
  urlString,
};

export type { Collector } from "./types.js";
export { CollectorContext } from "./context/index.js";
