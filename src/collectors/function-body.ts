import type {
  Function as FunctionNode,
  ArrowFunctionExpression,
} from "oxc-parser";
import type { Collector } from "./types.js";
import { getPosition } from "./ast-utils/index.js";

type AnyFunctionNode = FunctionNode | ArrowFunctionExpression;

class FunctionNormalizer {
  private refCounter = 0;
  private genericCounter = 0;
  private readonly refMap = new Map<string, string>();
  private readonly genericMap = new Map<string, string>();

  private ref(name: string): string {
    if (!this.refMap.has(name)) {
      this.refMap.set(name, `$${this.refCounter++}`);
    }
    return this.refMap.get(name)!;
  }

  private generic(name: string): string {
    if (!this.genericMap.has(name)) {
      this.genericMap.set(name, `G${this.genericCounter++}`);
    }
    return this.genericMap.get(name)!;
  }

  normalize(node: AnyFunctionNode): string {
    if (node.typeParameters) {
      for (const param of node.typeParameters.params) {
        this.generic(param.name.name);
      }
    }

    const async_ = node.async ? "async " : "";
    const generator = "generator" in node && node.generator ? "*" : "";
    const generics = node.typeParameters
      ? `<${node.typeParameters.params.map((p) => this.generic(p.name.name)).join(",")}>`
      : "";

    const regularParams: any[] = [];
    let restParam: any = null;
    for (const param of node.params) {
      if ((param as any).type === "RestElement") {
        restParam = param;
      } else {
        regularParams.push(param);
      }
    }
    const params = regularParams.map((p) => this.normalizeParam(p));
    const rest = restParam
      ? [`...${this.normalizeBindingPattern(restParam.argument)}`]
      : [];
    const paramsStr = `(${[...params, ...rest].join(",")})`;

    const returnType = node.returnType
      ? `:${this.normalizeType(node.returnType.typeAnnotation)}`
      : "";

    const body = node.body ? this.normalizeBody(node.body) : "{}";

    return `${async_}${generator}${generics}${paramsStr}${returnType}=>${body}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeParam(param: any): string {
    // TSParameterProperty: class constructor `private x: string`
    if (param.type === "TSParameterProperty") {
      return this.normalizeParam(param.parameter);
    }
    // FormalParameter is BindingPattern directly (type_annotation and optional are on the same object)
    const optional = param.optional ? "?" : "";
    const type = param.typeAnnotation
      ? `:${this.normalizeType(param.typeAnnotation.typeAnnotation)}`
      : "";
    return `${this.normalizeBindingPattern(param)}${optional}${type}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeBindingPattern(pattern: any): string {
    switch (pattern.type) {
      case "Identifier":
        return this.ref(pattern.name);
      case "ObjectPattern": {
        const props = pattern.properties.map((p: any) => {
          if (p.type === "RestElement") {
            return `...${this.normalizeBindingPattern(p.argument)}`;
          }
          const key = this.normalizePropertyKey(p.key);
          const value = this.normalizeBindingPattern(p.value);
          return p.shorthand ? value : `${key}:${value}`;
        });
        const rest = pattern.rest
          ? [`...${this.normalizeBindingPattern(pattern.rest.argument)}`]
          : [];
        return `{${[...props, ...rest].join(",")}}`;
      }
      case "ArrayPattern": {
        const elems = pattern.elements.map((e: any) =>
          e ? this.normalizeBindingPattern(e) : "",
        );
        const rest = pattern.rest
          ? [`...${this.normalizeBindingPattern(pattern.rest.argument)}`]
          : [];
        return `[${[...elems, ...rest].join(",")}]`;
      }
      case "AssignmentPattern":
        return `${this.normalizeBindingPattern(pattern.left)}=${this.normalizeExpr(pattern.right)}`;
      default:
        return pattern.type;
    }
  }

  private normalizePropertyKey(key: any): string {
    if (key.type === "Identifier") return this.ref(key.name);
    if (key.type === "Literal") return this.normalizeLiteral(key);
    return key.type;
  }

  private normalizeBody(body: any): string {
    if (body.type === "BlockStatement") {
      return `{${body.body.map((s: any) => this.normalizeStmt(s)).join(";")}}`;
    }
    return this.normalizeExpr(body);
  }

  private normalizeStmt(node: any): string {
    switch (node.type) {
      case "BlockStatement":
        return `{${node.body.map((s: any) => this.normalizeStmt(s)).join(";")}}`;
      case "ExpressionStatement":
        return this.normalizeExpr(node.expression);
      case "ReturnStatement":
        return `return${node.argument ? ` ${this.normalizeExpr(node.argument)}` : ""}`;
      case "IfStatement": {
        const test = this.normalizeExpr(node.test);
        const cons = this.normalizeStmt(node.consequent);
        const alt = node.alternate
          ? ` else ${this.normalizeStmt(node.alternate)}`
          : "";
        return `if(${test})${cons}${alt}`;
      }
      case "WhileStatement":
        return `while(${this.normalizeExpr(node.test)})${this.normalizeStmt(node.body)}`;
      case "DoWhileStatement":
        return `do ${this.normalizeStmt(node.body)} while(${this.normalizeExpr(node.test)})`;
      case "ForStatement": {
        const init = node.init ? this.normalizeForInit(node.init) : "";
        const test = node.test ? this.normalizeExpr(node.test) : "";
        const update = node.update ? this.normalizeExpr(node.update) : "";
        return `for(${init};${test};${update})${this.normalizeStmt(node.body)}`;
      }
      case "ForInStatement":
        return `forin(${this.normalizeForLeft(node.left)},${this.normalizeExpr(node.right)})${this.normalizeStmt(node.body)}`;
      case "ForOfStatement":
        return `forof(${node.await ? "await," : ""}${this.normalizeForLeft(node.left)},${this.normalizeExpr(node.right)})${this.normalizeStmt(node.body)}`;
      case "SwitchStatement": {
        const disc = this.normalizeExpr(node.discriminant);
        const cases = node.cases.map((c: any) => {
          const test = c.test
            ? `case ${this.normalizeExpr(c.test)}`
            : "default";
          const body = c.consequent
            .map((s: any) => this.normalizeStmt(s))
            .join(";");
          return `${test}:${body}`;
        });
        return `switch(${disc}){${cases.join(";")}}`;
      }
      case "BreakStatement":
        return `break${node.label ? ` ${this.ref(node.label.name)}` : ""}`;
      case "ContinueStatement":
        return `continue${node.label ? ` ${this.ref(node.label.name)}` : ""}`;
      case "ThrowStatement":
        return `throw ${this.normalizeExpr(node.argument)}`;
      case "TryStatement": {
        const block = this.normalizeStmt(node.block);
        const handler = node.handler
          ? ` catch(${node.handler.param ? this.normalizeBindingPattern(node.handler.param) : ""})${this.normalizeStmt(node.handler.body)}`
          : "";
        const fin = node.finalizer
          ? ` finally ${this.normalizeStmt(node.finalizer)}`
          : "";
        return `try ${block}${handler}${fin}`;
      }
      case "VariableDeclaration": {
        const decls = node.declarations.map((d: any) => {
          const id = this.normalizeBindingPattern(d.id);
          const typeAnn = d.id.typeAnnotation
            ? `:${this.normalizeType(d.id.typeAnnotation.typeAnnotation)}`
            : "";
          const init = d.init ? `=${this.normalizeExpr(d.init)}` : "";
          return `${id}${typeAnn}${init}`;
        });
        return `${node.kind} ${decls.join(",")}`;
      }
      case "FunctionDeclaration": {
        const name = node.id ? this.ref(node.id.name) : "";
        return `function ${name}${new FunctionNormalizer().normalize(node)}`;
      }
      case "LabeledStatement":
        return `${this.ref(node.label.name)}:${this.normalizeStmt(node.body)}`;
      case "EmptyStatement":
        return "";
      case "DebuggerStatement":
        return "debugger";
      default:
        return node.type;
    }
  }

  private normalizeForInit(node: any): string {
    if (node.type === "VariableDeclaration") return this.normalizeStmt(node);
    return this.normalizeExpr(node);
  }

  private normalizeForLeft(node: any): string {
    if (node.type === "VariableDeclaration") return this.normalizeStmt(node);
    return this.normalizeExpr(node);
  }

  private normalizeExpr(node: any): string {
    if (!node) return "";
    switch (node.type) {
      case "Identifier":
        return this.ref(node.name);
      case "Literal":
        return this.normalizeLiteral(node);
      case "TemplateLiteral": {
        const parts: string[] = [];
        for (let i = 0; i < node.quasis.length; i++) {
          const cooked =
            node.quasis[i].value.cooked ?? node.quasis[i].value.raw;
          if (cooked) parts.push(`str:${cooked}`);
          if (i < node.expressions.length) {
            parts.push(`\${${this.normalizeExpr(node.expressions[i])}}`);
          }
        }
        return `\`${parts.join("")}\``;
      }
      case "BinaryExpression":
      case "LogicalExpression":
        return `(${this.normalizeExpr(node.left)}${node.operator}${this.normalizeExpr(node.right)})`;
      case "UnaryExpression":
        return `(${node.operator}${this.normalizeExpr(node.argument)})`;
      case "UpdateExpression":
        return node.prefix
          ? `(${node.operator}${this.normalizeExpr(node.argument)})`
          : `(${this.normalizeExpr(node.argument)}${node.operator})`;
      case "AssignmentExpression":
        return `(${this.normalizeAssignTarget(node.left)}${node.operator}${this.normalizeExpr(node.right)})`;
      case "ConditionalExpression":
        return `(${this.normalizeExpr(node.test)}?${this.normalizeExpr(node.consequent)}:${this.normalizeExpr(node.alternate)})`;
      case "CallExpression": {
        const callee = this.normalizeCallee(node.callee);
        const typeArgs = node.typeArguments
          ? `<${node.typeArguments.params.map((t: any) => this.normalizeType(t)).join(",")}>`
          : "";
        const args = node.arguments
          .map((a: any) => this.normalizeArgument(a))
          .join(",");
        return `${callee}${typeArgs}(${args})`;
      }
      case "NewExpression": {
        const callee = this.normalizeCallee(node.callee);
        const typeArgs = node.typeArguments
          ? `<${node.typeArguments.params.map((t: any) => this.normalizeType(t)).join(",")}>`
          : "";
        const args = node.arguments
          .map((a: any) => this.normalizeArgument(a))
          .join(",");
        return `new ${callee}${typeArgs}(${args})`;
      }
      case "MemberExpression": {
        const obj = this.normalizeMemberExprObject(node.object);
        const optional = node.optional ? "?" : "";
        if (node.computed) {
          return `${obj}${optional}[${this.normalizeExpr(node.property)}]`;
        }
        return `${obj}${optional}.${node.property.name}`;
      }
      case "ChainExpression":
        return this.normalizeExpr(node.expression);
      case "SpreadElement":
        return `...${this.normalizeExpr(node.argument)}`;
      case "ArrayExpression": {
        const elements = node.elements.map((e: any) => {
          if (!e) return "";
          if (e.type === "SpreadElement")
            return `...${this.normalizeExpr(e.argument)}`;
          return this.normalizeExpr(e);
        });
        return `[${elements.join(",")}]`;
      }
      case "ObjectExpression": {
        const props = node.properties.map((p: any) =>
          this.normalizeObjectProperty(p),
        );
        return `{${props.join(",")}}`;
      }
      case "ArrowFunctionExpression":
      case "FunctionExpression":
        return new FunctionNormalizer().normalize(node as AnyFunctionNode);
      case "SequenceExpression":
        return `(${node.expressions.map((e: any) => this.normalizeExpr(e)).join(",")})`;
      case "TaggedTemplateExpression":
        return `${this.normalizeExpr(node.tag)}${this.normalizeExpr(node.quasi)}`;
      case "YieldExpression":
        return `yield${node.delegate ? "*" : ""}${node.argument ? ` ${this.normalizeExpr(node.argument)}` : ""}`;
      case "AwaitExpression":
        return `await ${this.normalizeExpr(node.argument)}`;
      case "ThisExpression":
        return "this";
      case "Super":
        return "super";
      case "MetaProperty":
        return `${node.meta.name}.${node.property.name}`;
      case "TSAsExpression":
      case "TSSatisfiesExpression":
        return `(${this.normalizeExpr(node.expression)} as ${this.normalizeType(node.typeAnnotation)})`;
      case "TSTypeAssertion":
        return `(<${this.normalizeType(node.typeAnnotation)}>${this.normalizeExpr(node.expression)})`;
      case "TSNonNullExpression":
        return `${this.normalizeExpr(node.expression)}!`;
      case "TSInstantiationExpression":
        return `${this.normalizeExpr(node.expression)}<${node.typeArguments.params.map((t: any) => this.normalizeType(t)).join(",")}>`;
      default:
        return node.type;
    }
  }

  private normalizeMemberExprObject(node: any): string {
    if (node.type === "Identifier") return node.name;
    if (node.type === "MemberExpression") {
      const obj = this.normalizeMemberExprObject(node.object);
      const optional = node.optional ? "?" : "";
      if (node.computed) {
        return `${obj}${optional}[${this.normalizeExpr(node.property)}]`;
      }
      return `${obj}${optional}.${node.property.name}`;
    }
    return this.normalizeExpr(node);
  }

  private normalizeCallee(node: any): string {
    if (node.type === "Identifier") return node.name;
    if (node.type === "MemberExpression" && !node.computed) {
      const obj = this.normalizeExpr(node.object);
      const optional = node.optional ? "?" : "";
      return `${obj}${optional}.${node.property.name}`;
    }
    return this.normalizeExpr(node);
  }

  private normalizeAssignTarget(node: any): string {
    if (node.type === "Identifier") return this.ref(node.name);
    if (node.type === "MemberExpression") return this.normalizeExpr(node);
    return this.normalizeBindingPattern(node);
  }

  private normalizeArgument(node: any): string {
    if (node.type === "SpreadElement")
      return `...${this.normalizeExpr(node.argument)}`;
    return this.normalizeExpr(node);
  }

  private normalizeObjectProperty(prop: any): string {
    if (prop.type === "SpreadElement")
      return `...${this.normalizeExpr(prop.argument)}`;
    const key = this.normalizePropertyKey(prop.key);
    if (prop.method) {
      return `${key}:${new FunctionNormalizer().normalize(prop.value)}`;
    }
    if (prop.shorthand) return this.normalizeExpr(prop.value);
    return `${key}:${this.normalizeExpr(prop.value)}`;
  }

  private normalizeLiteral(node: any): string {
    if (node.regex) return `regex:${node.regex.pattern}/${node.regex.flags}`;
    if (node.value === null) return "null";
    if (typeof node.bigint !== "undefined") return `bigint:${node.bigint}`;
    if (typeof node.value === "string") return `str:${node.value}`;
    if (typeof node.value === "number") return `num:${node.value}`;
    if (typeof node.value === "boolean") return `bool:${node.value}`;
    return `lit:${String(node.value)}`;
  }

  private normalizeType(node: any): string {
    if (!node) return "any";
    switch (node.type) {
      case "TSStringKeyword":
        return "string";
      case "TSNumberKeyword":
        return "number";
      case "TSBooleanKeyword":
        return "boolean";
      case "TSNullKeyword":
        return "null";
      case "TSUndefinedKeyword":
        return "undefined";
      case "TSAnyKeyword":
        return "any";
      case "TSUnknownKeyword":
        return "unknown";
      case "TSNeverKeyword":
        return "never";
      case "TSVoidKeyword":
        return "void";
      case "TSObjectKeyword":
        return "object";
      case "TSSymbolKeyword":
        return "symbol";
      case "TSBigIntKeyword":
        return "bigint";
      case "TSTypeReference": {
        const name =
          node.typeName.type === "Identifier"
            ? node.typeName.name
            : node.typeName.type;
        if (this.genericMap.has(name)) return this.genericMap.get(name)!;
        const args = node.typeArguments
          ? `<${node.typeArguments.params.map((t: any) => this.normalizeType(t)).join(",")}>`
          : "";
        return `${this.ref(name)}${args}`;
      }
      case "TSArrayType":
        return `${this.normalizeType(node.elementType)}[]`;
      case "TSUnionType":
        return node.types
          .map((t: any) => this.normalizeType(t))
          .sort()
          .join("|");
      case "TSIntersectionType":
        return node.types
          .map((t: any) => this.normalizeType(t))
          .sort()
          .join("&");
      case "TSTupleType": {
        const elems = node.elementTypes.map((t: any) => {
          if (t.type === "TSOptionalType")
            return `${this.normalizeType(t.typeAnnotation)}?`;
          if (t.type === "TSRestType")
            return `...${this.normalizeType(t.typeAnnotation)}`;
          return this.normalizeType(t);
        });
        return `[${elems.join(",")}]`;
      }
      case "TSFunctionType": {
        const params = (node.params.items ?? [])
          .map((p: any) =>
            p.pattern?.typeAnnotation
              ? this.normalizeType(p.pattern.typeAnnotation.typeAnnotation)
              : "any",
          )
          .join(",");
        const ret = this.normalizeType(node.returnType.typeAnnotation);
        return `(${params})=>${ret}`;
      }
      case "TSTypeLiteral": {
        const members = node.members.map((m: any) => {
          if (m.type !== "TSPropertySignature") return m.type;
          const key =
            m.key.type === "Identifier" ? this.ref(m.key.name) : String(m.key);
          const type = m.typeAnnotation
            ? this.normalizeType(m.typeAnnotation.typeAnnotation)
            : "any";
          return `${key}${m.optional ? "?" : ""}:${type}`;
        });
        return `{${members.sort().join(";")}}`;
      }
      case "TSConditionalType":
        return `${this.normalizeType(node.checkType)} extends ${this.normalizeType(node.extendsType)}?${this.normalizeType(node.trueType)}:${this.normalizeType(node.falseType)}`;
      case "TSTypeOperator":
        return `${node.operator} ${this.normalizeType(node.typeAnnotation)}`;
      case "TSLiteralType": {
        const lit = node.literal;
        if (lit.type === "TemplateLiteral")
          return lit.quasis.map((q: any) => q.value.cooked).join("${}");
        if (lit.type === "UnaryExpression")
          return `${lit.operator}${(lit.argument as any).value}`;
        return String(lit.value);
      }
      case "TSParenthesizedType":
        return `(${this.normalizeType(node.typeAnnotation)})`;
      case "TSTypeQuery":
        return `typeof ${node.exprName.type === "Identifier" ? this.ref(node.exprName.name) : node.exprName.type}`;
      default:
        return node.type;
    }
  }
}

export const functionBody: Collector = {
  id: "function",
  createJSVisitor(context) {
    let methodDepth = 0;

    function collect(node: AnyFunctionNode) {
      if (methodDepth > 0) return;
      const key = new FunctionNormalizer().normalize(node);
      const displayName =
        "id" in node && node.id ? node.id.name : "<anonymous>";
      context.add({
        key,
        displayName,
        location: {
          start: getPosition(context.code, node.start),
          end: getPosition(context.code, node.end),
        },
      });
    }

    return {
      MethodDefinition() {
        methodDepth++;
      },
      "MethodDefinition:exit"() {
        methodDepth--;
      },
      TSAbstractMethodDefinition() {
        methodDepth++;
      },
      "TSAbstractMethodDefinition:exit"() {
        methodDepth--;
      },
      Property(node: any) {
        if (node.method) methodDepth++;
      },
      "Property:exit"(node: any) {
        if (node.method) methodDepth--;
      },
      FunctionDeclaration: collect,
      FunctionExpression: collect,
      ArrowFunctionExpression: collect,
    };
  },
};
