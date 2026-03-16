import type { Context } from "../context.js";
import type { Language } from "./language.js";
import type { JSASTVisitor } from "./js-ast-visitor.js";

export interface Analyzer {
  match(language: Language): boolean;
  createJSVisitor?: (ctx: Context) => JSASTVisitor;
}
