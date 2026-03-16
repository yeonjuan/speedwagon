import type { FunctionDeclaration } from "@swc/core";

export interface JSASTVisitor {
  FunctionDeclaration?: (node: FunctionDeclaration) => void;
}
