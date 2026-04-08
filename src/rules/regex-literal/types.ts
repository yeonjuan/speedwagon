import type { Location } from "../../types/index.js";

export interface RegexLiteralInfo {
  location: Location;
  snippet: string;
  data: {
    pattern: string;
    flags: string;
    raw: string;
  };
}
