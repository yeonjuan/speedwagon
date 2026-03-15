import { Language } from "./types.js";

export class LanguageDetector {
  static detect(filepath: string): Language | null {
    const extension = filepath.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "js":
        return "js";
      case "jsx":
        return "jsx";
      case "ts":
        return "ts";
      case "tsx":
        return "tsx";
      default:
        return null;
    }
  }
}
