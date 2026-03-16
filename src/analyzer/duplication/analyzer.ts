import type { Context } from "../context.js";
import type { Analyzer } from "../types/analyzer.js";
import type { JSASTVisitor } from "../types/js-ast-visitor.js";
import type { Language } from "../types/language.js";

export class DuplicationAnalyzer implements Analyzer {
  match(language: Language): boolean {
    return true;
  }

  createJSVisitor = (ctx: Context): JSASTVisitor => {
    return {
      FunctionDeclaration(node) {},
    };
  };
}
