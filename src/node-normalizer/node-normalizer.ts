import type {
  Node,
  RegExpLiteral,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  NullLiteral,
  BigIntLiteral,
  IdentifierReference,
  IdentifierName,
  PrivateIdentifier,
  ThisExpression,
  Super,
  ArrayExpression,
  ObjectExpression,
  ObjectProperty,
  SpreadElement,
  TemplateLiteral,
  TemplateElement,
  TaggedTemplateExpression,
  ComputedMemberExpression,
  StaticMemberExpression,
  PrivateFieldExpression,
  CallExpression,
  NewExpression,
  MetaProperty,
  UpdateExpression,
  UnaryExpression,
  BinaryExpression,
  PrivateInExpression,
  LogicalExpression,
  ConditionalExpression,
  AssignmentExpression,
  SequenceExpression,
  AwaitExpression,
  YieldExpression,
  ChainExpression,
  ParenthesizedExpression,
  ImportExpression,
  ArrowFunctionExpression,
  Function,
  V8IntrinsicExpression,
  ArrayPattern,
  ObjectPattern,
  AssignmentPattern,
  BindingProperty,
  BindingRestElement,
  AssignmentTargetPropertyIdentifier,
  BlockStatement,
  ExpressionStatement,
  Directive,
  IfStatement,
  DoWhileStatement,
  WhileStatement,
  ForStatement,
  ForInStatement,
  ForOfStatement,
  ContinueStatement,
  BreakStatement,
  ReturnStatement,
  LabeledStatement,
  SwitchStatement,
  SwitchCase,
  ThrowStatement,
  TryStatement,
  CatchClause,
  WithStatement,
  VariableDeclaration,
  VariableDeclarator,
  Class,
  ClassBody,
  MethodDefinition,
  PropertyDefinition,
  StaticBlock,
  AccessorProperty,
  Decorator,
  ImportDeclaration,
  ImportSpecifier,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportAttribute,
  ExportNamedDeclaration,
  ExportDefaultDeclaration,
  ExportAllDeclaration,
  ExportSpecifier,
  JSXElement,
  JSXOpeningElement,
  JSXClosingElement,
  JSXFragment,
  JSXAttribute,
  JSXSpreadAttribute,
  JSXIdentifier,
  JSXMemberExpression,
  JSXNamespacedName,
  JSXExpressionContainer,
  JSXSpreadChild,
  JSXText,
  TSAsExpression,
  TSSatisfiesExpression,
  TSTypeAssertion,
  TSNonNullExpression,
  TSInstantiationExpression,
  TSTypeAnnotation,
  TSTypeReference,
  TSQualifiedName,
  TSUnionType,
  TSIntersectionType,
  TSArrayType,
  TSLiteralType,
  TSConditionalType,
  TSTypeLiteral,
  TSPropertySignature,
  TSIndexSignature,
  TSCallSignatureDeclaration,
  TSMethodSignature,
  TSConstructSignatureDeclaration,
  TSTupleType,
  TSNamedTupleMember,
  TSOptionalType,
  TSRestType,
  TSTypeOperator,
  TSTypeQuery,
  TSInferType,
  TSMappedType,
  TSTemplateLiteralType,
  TSParenthesizedType,
  TSIndexedAccessType,
  TSImportType,
  TSFunctionType,
  TSConstructorType,
  TSTypePredicate,
  TSEnumDeclaration,
  TSEnumMember,
  TSTypeAliasDeclaration,
  TSInterfaceDeclaration,
  TSInterfaceHeritage,
  TSModuleDeclaration,
  TSModuleBlock,
  TSExportAssignment,
  TSNamespaceExportDeclaration,
  TSImportEqualsDeclaration,
  TSExternalModuleReference,
  TSTypeParameter,
  TSTypeParameterDeclaration,
  TSTypeParameterInstantiation,
  TSGlobalDeclaration,
} from "oxc-parser";

function s(node: Node | null | undefined): string {
  if (node == null) return "";
  return stringify(node);
}

function ss(nodes: (Node | null | undefined)[]): string {
  return nodes.map(s).join(",");
}

// Literals

function stringLiteral(node: StringLiteral) {
  return `str(${node.value})`;
}

function regExpLiteral(node: RegExpLiteral) {
  return `regex(${node.regex.pattern}/${node.regex.flags})`;
}

function numericLiteral(node: NumericLiteral) {
  return `num(${node.value})`;
}

function booleanLiteral(node: BooleanLiteral) {
  return `boolean(${node.value})`;
}

function nullLiteral(_node: NullLiteral) {
  return `null`;
}

function bigintLiteral(node: BigIntLiteral) {
  return `bigint(${node.bigint})`;
}

function literal(
  node:
    | StringLiteral
    | RegExpLiteral
    | NumericLiteral
    | BooleanLiteral
    | NullLiteral
    | BigIntLiteral,
): string {
  if ("regex" in node) return regExpLiteral(node);
  if ("bigint" in node) return bigintLiteral(node as BigIntLiteral);
  const { value } = node as
    | StringLiteral
    | NumericLiteral
    | BooleanLiteral
    | NullLiteral;
  if (value === null) return nullLiteral(node as NullLiteral);
  if (typeof value === "string") return stringLiteral(node as StringLiteral);
  if (typeof value === "number") return numericLiteral(node as NumericLiteral);
  return booleanLiteral(node as BooleanLiteral);
}

// Identifiers

function identifierReference(node: IdentifierReference) {
  return `id(${node.name})`;
}

function identifierName(node: IdentifierName) {
  return `id(${node.name})`;
}

function privateIdentifier(node: PrivateIdentifier) {
  return `#${node.name}`;
}

// Expressions

function thisExpression(_node: ThisExpression) {
  return `this`;
}

function superExpression(_node: Super) {
  return `super`;
}

function arrayExpression(node: ArrayExpression) {
  return `array(${node.elements.map((el) => (el == null ? "hole" : s(el))).join(",")})`;
}

function spreadElement(node: SpreadElement) {
  return `spread(${s(node.argument)})`;
}

function objectExpression(node: ObjectExpression) {
  return `obj(${ss(node.properties)})`;
}

function objectProperty(node: ObjectProperty) {
  const key = node.computed ? `[${s(node.key)}]` : s(node.key);
  return `prop(${node.kind},${key},${s(node.value)})`;
}

function templateLiteral(node: TemplateLiteral) {
  const parts: string[] = [];
  for (let i = 0; i < node.quasis.length; i++) {
    parts.push(s(node.quasis[i]));
    if (i < node.expressions.length) parts.push(s(node.expressions[i]));
  }
  return `template(${parts.join(",")})`;
}

function templateElement(node: TemplateElement) {
  return `tmpl(${node.value.raw})`;
}

function taggedTemplateExpression(node: TaggedTemplateExpression) {
  return `tagged(${s(node.tag)},${s(node.quasi)})`;
}

function computedMemberExpression(node: ComputedMemberExpression) {
  return `member(${s(node.object)},[${s(node.property)}])`;
}

function staticMemberExpression(node: StaticMemberExpression) {
  return `member(${s(node.object)}.${node.property.name})`;
}

function privateFieldExpression(node: PrivateFieldExpression) {
  return `member(${s(node.object)}.#${node.property.name})`;
}

function callExpression(node: CallExpression) {
  return `call(${s(node.callee)},${ss(node.arguments)})`;
}

function newExpression(node: NewExpression) {
  return `new(${s(node.callee)},${ss(node.arguments)})`;
}

function metaProperty(node: MetaProperty) {
  return `meta(${node.meta.name}.${node.property.name})`;
}

function updateExpression(node: UpdateExpression) {
  return `update(${node.operator},${node.prefix ? "pre" : "post"},${s(node.argument)})`;
}

function unaryExpression(node: UnaryExpression) {
  return `unary(${node.operator},${s(node.argument)})`;
}

function binaryExpression(node: BinaryExpression) {
  return `binary(${s(node.left)},${node.operator},${s(node.right)})`;
}

function privateInExpression(node: PrivateInExpression) {
  return `binary(#${node.left.name},in,${s(node.right)})`;
}

function logicalExpression(node: LogicalExpression) {
  return `logical(${s(node.left)},${node.operator},${s(node.right)})`;
}

function conditionalExpression(node: ConditionalExpression) {
  return `cond(${s(node.test)},${s(node.consequent)},${s(node.alternate)})`;
}

function assignmentExpression(node: AssignmentExpression) {
  return `assign(${s(node.left)},${node.operator},${s(node.right)})`;
}

function sequenceExpression(node: SequenceExpression) {
  return `seq(${ss(node.expressions)})`;
}

function awaitExpression(node: AwaitExpression) {
  return `await(${s(node.argument)})`;
}

function yieldExpression(node: YieldExpression) {
  return `yield(${node.delegate ? "*" : ""}${s(node.argument)})`;
}

function chainExpression(node: ChainExpression) {
  return `chain(${s(node.expression)})`;
}

function parenthesizedExpression(node: ParenthesizedExpression) {
  return `paren(${s(node.expression)})`;
}

function importExpression(node: ImportExpression) {
  return `import(${s(node.source)})`;
}

function arrowFunctionExpression(node: ArrowFunctionExpression) {
  return `arrow(${node.async ? "async," : ""}${ss(node.params)})=>${s(node.body)}`;
}

function functionNode(node: Function) {
  const id = node.id ? node.id.name : "";
  return `fn(${node.async ? "async," : ""}${node.generator ? "gen," : ""}${id},${ss(node.params)})${s(node.body)}`;
}

function v8IntrinsicExpression(node: V8IntrinsicExpression) {
  return `intrinsic(${node.name.name},${ss(node.arguments)})`;
}

// Patterns

function arrayPattern(node: ArrayPattern) {
  return `arrayPat(${node.elements.map((el) => (el == null ? "hole" : s(el))).join(",")})`;
}

function objectPattern(node: ObjectPattern) {
  return `objPat(${ss(node.properties)})`;
}

function assignmentPattern(node: AssignmentPattern) {
  return `assignPat(${s(node.left)},${s(node.right)})`;
}

function bindingRestElement(node: BindingRestElement) {
  return `rest(${s(node.argument)})`;
}

function assignmentTargetPropertyIdentifier(
  node: AssignmentTargetPropertyIdentifier,
) {
  return `prop(init,${s(node.key)},${s(node.value)})`;
}

// Statements

function blockStatement(node: BlockStatement) {
  return `block(${ss(node.body)})`;
}

function expressionStatement(node: ExpressionStatement) {
  return `exprStmt(${s(node.expression)})`;
}

function directive(node: Directive) {
  return `directive(${node.directive})`;
}

function ifStatement(node: IfStatement) {
  return `if(${s(node.test)},${s(node.consequent)}${node.alternate ? `,${s(node.alternate)}` : ""})`;
}

function doWhileStatement(node: DoWhileStatement) {
  return `doWhile(${s(node.body)},${s(node.test)})`;
}

function whileStatement(node: WhileStatement) {
  return `while(${s(node.test)},${s(node.body)})`;
}

function forStatement(node: ForStatement) {
  return `for(${s(node.init)};${s(node.test)};${s(node.update)},${s(node.body)})`;
}

function forInStatement(node: ForInStatement) {
  return `forIn(${s(node.left)},${s(node.right)},${s(node.body)})`;
}

function forOfStatement(node: ForOfStatement) {
  return `forOf(${node.await ? "await," : ""}${s(node.left)},${s(node.right)},${s(node.body)})`;
}

function continueStatement(node: ContinueStatement) {
  return `continue(${node.label ? node.label.name : ""})`;
}

function breakStatement(node: BreakStatement) {
  return `break(${node.label ? node.label.name : ""})`;
}

function returnStatement(node: ReturnStatement) {
  return `return(${s(node.argument)})`;
}

function labeledStatement(node: LabeledStatement) {
  return `label(${node.label.name},${s(node.body)})`;
}

function switchStatement(node: SwitchStatement) {
  return `switch(${s(node.discriminant)},${ss(node.cases)})`;
}

function switchCase(node: SwitchCase) {
  return `case(${s(node.test)},${ss(node.consequent)})`;
}

function throwStatement(node: ThrowStatement) {
  return `throw(${s(node.argument)})`;
}

function tryStatement(node: TryStatement) {
  return `try(${s(node.block)},${s(node.handler)},${s(node.finalizer)})`;
}

function catchClause(node: CatchClause) {
  return `catch(${s(node.param)},${s(node.body)})`;
}

function withStatement(node: WithStatement) {
  return `with(${s(node.object)},${s(node.body)})`;
}

// Declarations

function variableDeclaration(node: VariableDeclaration) {
  return `var(${node.kind},${ss(node.declarations)})`;
}

function variableDeclarator(node: VariableDeclarator) {
  return `declarator(${s(node.id)},${s(node.init)})`;
}

// Class

function classNode(node: Class) {
  return `class(${node.id ? node.id.name : ""},${s(node.superClass)},${s(node.body)})`;
}

function classBody(node: ClassBody) {
  return `classBody(${ss(node.body)})`;
}

function methodDefinition(node: MethodDefinition) {
  const key = node.computed ? `[${s(node.key)}]` : s(node.key);
  return `method(${node.kind},${node.static ? "static," : ""}${key},${s(node.value)})`;
}

function propertyDefinition(node: PropertyDefinition) {
  const key = node.computed ? `[${s(node.key)}]` : s(node.key);
  return `propDef(${node.static ? "static," : ""}${key},${s(node.value)})`;
}

function staticBlock(node: StaticBlock) {
  return `static(${ss(node.body)})`;
}

function accessorProperty(node: AccessorProperty) {
  const key = node.computed ? `[${s(node.key)}]` : s(node.key);
  return `accessor(${node.static ? "static," : ""}${key},${s(node.value)})`;
}

function decorator(node: Decorator) {
  return `decorator(${s(node.expression)})`;
}

// Module declarations

function importDeclaration(node: ImportDeclaration) {
  return `import(${ss(node.specifiers)},${s(node.source)})`;
}

function importSpecifier(node: ImportSpecifier) {
  return `importSpec(${s(node.imported)},${s(node.local)})`;
}

function importDefaultSpecifier(node: ImportDefaultSpecifier) {
  return `importDefault(${s(node.local)})`;
}

function importNamespaceSpecifier(node: ImportNamespaceSpecifier) {
  return `importNs(${s(node.local)})`;
}

function importAttribute(node: ImportAttribute) {
  return `importAttr(${s(node.key)},${s(node.value)})`;
}

function exportNamedDeclaration(node: ExportNamedDeclaration) {
  return `exportNamed(${s(node.declaration)},${ss(node.specifiers)})`;
}

function exportDefaultDeclaration(node: ExportDefaultDeclaration) {
  return `exportDefault(${s(node.declaration)})`;
}

function exportAllDeclaration(node: ExportAllDeclaration) {
  return `exportAll(${s(node.exported)},${s(node.source)})`;
}

function exportSpecifier(node: ExportSpecifier) {
  return `exportSpec(${s(node.local)},${s(node.exported)})`;
}

// JSX

function jsxElement(node: JSXElement) {
  return `jsx(${s(node.openingElement)},${ss(node.children)},${s(node.closingElement)})`;
}

function jsxOpeningElement(node: JSXOpeningElement) {
  return `jsxOpen(${s(node.name)},${ss(node.attributes)})`;
}

function jsxClosingElement(node: JSXClosingElement) {
  return `jsxClose(${s(node.name)})`;
}

function jsxFragment(node: JSXFragment) {
  return `jsxFrag(${ss(node.children)})`;
}

function jsxAttribute(node: JSXAttribute) {
  return `jsxAttr(${s(node.name)},${s(node.value)})`;
}

function jsxSpreadAttribute(node: JSXSpreadAttribute) {
  return `jsxSpread(${s(node.argument)})`;
}

function jsxIdentifier(node: JSXIdentifier) {
  return `jsxId(${node.name})`;
}

function jsxMemberExpression(node: JSXMemberExpression) {
  return `jsxMember(${s(node.object)}.${node.property.name})`;
}

function jsxNamespacedName(node: JSXNamespacedName) {
  return `jsxNs(${node.namespace.name}:${node.name.name})`;
}

function jsxExpressionContainer(node: JSXExpressionContainer) {
  return `jsxExpr(${s(node.expression)})`;
}

function jsxSpreadChild(node: JSXSpreadChild) {
  return `jsxSpreadChild(${s(node.expression)})`;
}

function jsxText(node: JSXText) {
  return `jsxText(${node.value})`;
}

// TypeScript expressions

function tsAsExpression(node: TSAsExpression) {
  return `as(${s(node.expression)},${s(node.typeAnnotation)})`;
}

function tsSatisfiesExpression(node: TSSatisfiesExpression) {
  return `satisfies(${s(node.expression)},${s(node.typeAnnotation)})`;
}

function tsTypeAssertion(node: TSTypeAssertion) {
  return `typeAssert(${s(node.typeAnnotation)},${s(node.expression)})`;
}

function tsNonNullExpression(node: TSNonNullExpression) {
  return `nonNull(${s(node.expression)})`;
}

function tsInstantiationExpression(node: TSInstantiationExpression) {
  return `instantiate(${s(node.expression)},${s(node.typeArguments)})`;
}

// TypeScript types

function tsTypeAnnotation(node: TSTypeAnnotation) {
  return s(node.typeAnnotation);
}

function tsTypeReference(node: TSTypeReference) {
  const args = node.typeArguments ? `<${s(node.typeArguments)}>` : "";
  return `typeRef(${s(node.typeName)}${args})`;
}

function tsQualifiedName(node: TSQualifiedName) {
  return `${s(node.left)}.${node.right.name}`;
}

function tsUnionType(node: TSUnionType) {
  return `union(${ss(node.types)})`;
}

function tsIntersectionType(node: TSIntersectionType) {
  return `intersection(${ss(node.types)})`;
}

function tsArrayType(node: TSArrayType) {
  return `array(${s(node.elementType)})[]`;
}

function tsLiteralType(node: TSLiteralType) {
  return `tsLit(${s(node.literal)})`;
}

function tsConditionalType(node: TSConditionalType) {
  return `tsCond(${s(node.checkType)},${s(node.extendsType)},${s(node.trueType)},${s(node.falseType)})`;
}

function tsTypeLiteral(node: TSTypeLiteral) {
  return `typeLit({${ss(node.members)}})`;
}

function tsPropertySignature(node: TSPropertySignature) {
  const key = node.computed ? `[${s(node.key)}]` : s(node.key);
  return `tsProp(${key}${node.optional ? "?" : ""},${s(node.typeAnnotation)})`;
}

function tsIndexSignature(node: TSIndexSignature) {
  return `tsIndex(${ss(node.parameters)},${s(node.typeAnnotation)})`;
}

function tsCallSignatureDeclaration(node: TSCallSignatureDeclaration) {
  return `tsCall(${ss(node.params)},${s(node.returnType)})`;
}

function tsMethodSignature(node: TSMethodSignature) {
  const key = node.computed ? `[${s(node.key)}]` : s(node.key);
  return `tsMethod(${node.kind},${key}${node.optional ? "?" : ""},${ss(node.params)},${s(node.returnType)})`;
}

function tsConstructSignatureDeclaration(
  node: TSConstructSignatureDeclaration,
) {
  return `tsConstruct(${ss(node.params)},${s(node.returnType)})`;
}

function tsTupleType(node: TSTupleType) {
  return `tuple(${ss(node.elementTypes)})`;
}

function tsNamedTupleMember(node: TSNamedTupleMember) {
  return `namedTuple(${node.label.name}${node.optional ? "?" : ""},${s(node.elementType)})`;
}

function tsOptionalType(node: TSOptionalType) {
  return `optional(${s(node.typeAnnotation)})`;
}

function tsRestType(node: TSRestType) {
  return `tsRest(${s(node.typeAnnotation)})`;
}

function tsTypeOperator(node: TSTypeOperator) {
  return `${node.operator}(${s(node.typeAnnotation)})`;
}

function tsTypeQuery(node: TSTypeQuery) {
  return `typeof(${s(node.exprName)}${node.typeArguments ? `<${s(node.typeArguments)}>` : ""})`;
}

function tsInferType(node: TSInferType) {
  return `infer(${s(node.typeParameter)})`;
}

function tsMappedType(node: TSMappedType) {
  return `mapped(${node.key.name},${s(node.constraint)},${s(node.typeAnnotation)})`;
}

function tsTemplateLiteralType(node: TSTemplateLiteralType) {
  const parts: string[] = [];
  for (let i = 0; i < node.quasis.length; i++) {
    parts.push(s(node.quasis[i]));
    if (i < node.types.length) parts.push(s(node.types[i]));
  }
  return `tsTemplate(${parts.join(",")})`;
}

function tsParenthesizedType(node: TSParenthesizedType) {
  return `tsParen(${s(node.typeAnnotation)})`;
}

function tsIndexedAccessType(node: TSIndexedAccessType) {
  return `indexed(${s(node.objectType)}[${s(node.indexType)}])`;
}

function tsImportType(node: TSImportType) {
  return `tsImport(${s(node.source)}${node.qualifier ? `,${s(node.qualifier)}` : ""}${node.typeArguments ? `<${s(node.typeArguments)}>` : ""})`;
}

function tsFunctionType(node: TSFunctionType) {
  return `tsFn(${ss(node.params)},${s(node.returnType)})`;
}

function tsConstructorType(node: TSConstructorType) {
  return `tsConstructor(${node.abstract ? "abstract," : ""}${ss(node.params)},${s(node.returnType)})`;
}

function tsTypePredicate(node: TSTypePredicate) {
  return `predicate(${s(node.parameterName)}${node.asserts ? ",asserts" : ""},${s(node.typeAnnotation)})`;
}

function tsTypeParameterInstantiation(node: TSTypeParameterInstantiation) {
  return ss(node.params);
}

function tsTypeParameter(node: TSTypeParameter) {
  return `typeParam(${node.name.name}${node.constraint ? `,extends ${s(node.constraint)}` : ""}${node.default ? `,=${s(node.default)}` : ""})`;
}

function tsTypeParameterDeclaration(node: TSTypeParameterDeclaration) {
  return `<${ss(node.params)}>`;
}

// TypeScript declarations

function tsEnumDeclaration(node: TSEnumDeclaration) {
  return `enum(${node.id.name},${ss(node.body.members)})`;
}

function tsEnumMember(node: TSEnumMember) {
  return `enumMember(${s(node.id)},${s(node.initializer)})`;
}

function tsTypeAliasDeclaration(node: TSTypeAliasDeclaration) {
  return `type(${node.id.name},${s(node.typeAnnotation)})`;
}

function tsInterfaceDeclaration(node: TSInterfaceDeclaration) {
  return `interface(${node.id.name},${ss(node.extends)},${s(node.body)})`;
}

function tsInterfaceHeritage(node: TSInterfaceHeritage) {
  return s(node.expression);
}

function tsModuleDeclaration(node: TSModuleDeclaration | TSGlobalDeclaration) {
  return `module(${s(node.id)},${s(node.body)})`;
}

function tsModuleBlock(node: TSModuleBlock) {
  return `moduleBlock(${ss(node.body)})`;
}

function tsExportAssignment(node: TSExportAssignment) {
  return `export=(${s(node.expression)})`;
}

function tsNamespaceExportDeclaration(node: TSNamespaceExportDeclaration) {
  return `exportNs(${node.id.name})`;
}

function tsImportEqualsDeclaration(node: TSImportEqualsDeclaration) {
  return `importEquals(${node.id.name},${s(node.moduleReference)})`;
}

function tsExternalModuleReference(node: TSExternalModuleReference) {
  return `require(${s(node.expression)})`;
}

export function stringify(node: Node): string {
  switch (node.type) {
    case "Literal":
      return literal(
        node as
          | StringLiteral
          | RegExpLiteral
          | NumericLiteral
          | BooleanLiteral
          | NullLiteral
          | BigIntLiteral,
      );
    case "Identifier":
      return identifierReference(node as IdentifierReference);
    case "PrivateIdentifier":
      return privateIdentifier(node);
    case "ThisExpression":
      return thisExpression(node);
    case "Super":
      return superExpression(node);
    case "ArrayExpression":
      return arrayExpression(node);
    case "SpreadElement":
      return spreadElement(node);
    case "ObjectExpression":
      return objectExpression(node);
    case "TemplateLiteral":
      return templateLiteral(node);
    case "TemplateElement":
      return templateElement(node);
    case "TaggedTemplateExpression":
      return taggedTemplateExpression(node);
    case "MemberExpression":
      if (node.computed)
        return computedMemberExpression(node as ComputedMemberExpression);
      if ("name" in node.property)
        return staticMemberExpression(node as StaticMemberExpression);
      return privateFieldExpression(node as PrivateFieldExpression);
    case "CallExpression":
      return callExpression(node);
    case "NewExpression":
      return newExpression(node);
    case "MetaProperty":
      return metaProperty(node);
    case "UpdateExpression":
      return updateExpression(node);
    case "UnaryExpression":
      return unaryExpression(node);
    case "BinaryExpression":
      if (
        (node as unknown as PrivateInExpression).left.type ===
        "PrivateIdentifier"
      ) {
        return privateInExpression(node as unknown as PrivateInExpression);
      }
      return binaryExpression(node as BinaryExpression);
    case "LogicalExpression":
      return logicalExpression(node);
    case "ConditionalExpression":
      return conditionalExpression(node);
    case "AssignmentExpression":
      return assignmentExpression(node);
    case "SequenceExpression":
      return sequenceExpression(node);
    case "AwaitExpression":
      return awaitExpression(node);
    case "YieldExpression":
      return yieldExpression(node);
    case "ChainExpression":
      return chainExpression(node);
    case "ParenthesizedExpression":
      return parenthesizedExpression(node);
    case "ImportExpression":
      return importExpression(node);
    case "ArrowFunctionExpression":
      return arrowFunctionExpression(node);
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "TSDeclareFunction":
    case "TSEmptyBodyFunctionExpression":
      return functionNode(node as unknown as Function);
    case "V8IntrinsicExpression":
      return v8IntrinsicExpression(node);
    case "ArrayPattern":
      return arrayPattern(node as ArrayPattern);
    case "ObjectPattern":
      return objectPattern(node as ObjectPattern);
    case "AssignmentPattern":
      return assignmentPattern(node as AssignmentPattern);
    case "Property": {
      const prop = node as
        | ObjectProperty
        | BindingProperty
        | AssignmentTargetPropertyIdentifier;
      if (
        "shorthand" in prop &&
        prop.shorthand &&
        !("method" in prop && prop.method)
      ) {
        return assignmentTargetPropertyIdentifier(
          prop as AssignmentTargetPropertyIdentifier,
        );
      }
      return objectProperty(prop as ObjectProperty);
    }
    case "RestElement":
      return bindingRestElement(node as BindingRestElement);
    case "BlockStatement":
      return blockStatement(node as BlockStatement);
    case "ExpressionStatement":
      if ("directive" in node && typeof node.directive === "string") {
        return directive(node as Directive);
      }
      return expressionStatement(node as ExpressionStatement);
    case "IfStatement":
      return ifStatement(node);
    case "DoWhileStatement":
      return doWhileStatement(node);
    case "WhileStatement":
      return whileStatement(node);
    case "ForStatement":
      return forStatement(node);
    case "ForInStatement":
      return forInStatement(node);
    case "ForOfStatement":
      return forOfStatement(node);
    case "ContinueStatement":
      return continueStatement(node);
    case "BreakStatement":
      return breakStatement(node);
    case "ReturnStatement":
      return returnStatement(node);
    case "LabeledStatement":
      return labeledStatement(node);
    case "SwitchStatement":
      return switchStatement(node);
    case "SwitchCase":
      return switchCase(node);
    case "ThrowStatement":
      return throwStatement(node);
    case "TryStatement":
      return tryStatement(node);
    case "CatchClause":
      return catchClause(node);
    case "WithStatement":
      return withStatement(node);
    case "EmptyStatement":
      return `;`;
    case "DebuggerStatement":
      return `debugger`;
    case "VariableDeclaration":
      return variableDeclaration(node);
    case "VariableDeclarator":
      return variableDeclarator(node);
    case "ClassDeclaration":
    case "ClassExpression":
      return classNode(node);
    case "ClassBody":
      return classBody(node);
    case "MethodDefinition":
    case "TSAbstractMethodDefinition":
      return methodDefinition(node);
    case "PropertyDefinition":
    case "TSAbstractPropertyDefinition":
      return propertyDefinition(node);
    case "StaticBlock":
      return staticBlock(node);
    case "AccessorProperty":
    case "TSAbstractAccessorProperty":
      return accessorProperty(node);
    case "Decorator":
      return decorator(node);
    case "ImportDeclaration":
      return importDeclaration(node);
    case "ImportSpecifier":
      return importSpecifier(node);
    case "ImportDefaultSpecifier":
      return importDefaultSpecifier(node);
    case "ImportNamespaceSpecifier":
      return importNamespaceSpecifier(node);
    case "ImportAttribute":
      return importAttribute(node);
    case "ExportNamedDeclaration":
      return exportNamedDeclaration(node);
    case "ExportDefaultDeclaration":
      return exportDefaultDeclaration(node);
    case "ExportAllDeclaration":
      return exportAllDeclaration(node);
    case "ExportSpecifier":
      return exportSpecifier(node);
    case "JSXElement":
      return jsxElement(node);
    case "JSXOpeningElement":
      return jsxOpeningElement(node);
    case "JSXClosingElement":
      return jsxClosingElement(node);
    case "JSXFragment":
      return jsxFragment(node);
    case "JSXOpeningFragment":
      return `jsxOpenFrag`;
    case "JSXClosingFragment":
      return `jsxCloseFrag`;
    case "JSXAttribute":
      return jsxAttribute(node);
    case "JSXSpreadAttribute":
      return jsxSpreadAttribute(node);
    case "JSXIdentifier":
      return jsxIdentifier(node);
    case "JSXMemberExpression":
      return jsxMemberExpression(node);
    case "JSXNamespacedName":
      return jsxNamespacedName(node);
    case "JSXExpressionContainer":
      return jsxExpressionContainer(node);
    case "JSXEmptyExpression":
      return `jsxEmpty`;
    case "JSXSpreadChild":
      return jsxSpreadChild(node);
    case "JSXText":
      return jsxText(node);
    case "TSAsExpression":
      return tsAsExpression(node);
    case "TSSatisfiesExpression":
      return tsSatisfiesExpression(node);
    case "TSTypeAssertion":
      return tsTypeAssertion(node);
    case "TSNonNullExpression":
      return tsNonNullExpression(node);
    case "TSInstantiationExpression":
      return tsInstantiationExpression(node);
    case "TSTypeAnnotation":
      return tsTypeAnnotation(node);
    case "TSTypeReference":
      return tsTypeReference(node);
    case "TSQualifiedName":
      return tsQualifiedName(node);
    case "TSUnionType":
      return tsUnionType(node);
    case "TSIntersectionType":
      return tsIntersectionType(node);
    case "TSArrayType":
      return tsArrayType(node);
    case "TSLiteralType":
      return tsLiteralType(node);
    case "TSConditionalType":
      return tsConditionalType(node);
    case "TSTypeLiteral":
      return tsTypeLiteral(node);
    case "TSPropertySignature":
      return tsPropertySignature(node);
    case "TSIndexSignature":
      return tsIndexSignature(node);
    case "TSCallSignatureDeclaration":
      return tsCallSignatureDeclaration(node);
    case "TSMethodSignature":
      return tsMethodSignature(node);
    case "TSConstructSignatureDeclaration":
      return tsConstructSignatureDeclaration(node);
    case "TSTupleType":
      return tsTupleType(node);
    case "TSNamedTupleMember":
      return tsNamedTupleMember(node);
    case "TSOptionalType":
      return tsOptionalType(node);
    case "TSRestType":
      return tsRestType(node);
    case "TSTypeOperator":
      return tsTypeOperator(node);
    case "TSTypeQuery":
      return tsTypeQuery(node);
    case "TSInferType":
      return tsInferType(node);
    case "TSMappedType":
      return tsMappedType(node);
    case "TSTemplateLiteralType":
      return tsTemplateLiteralType(node);
    case "TSParenthesizedType":
      return tsParenthesizedType(node);
    case "TSIndexedAccessType":
      return tsIndexedAccessType(node);
    case "TSImportType":
      return tsImportType(node);
    case "TSFunctionType":
      return tsFunctionType(node);
    case "TSConstructorType":
      return tsConstructorType(node);
    case "TSTypePredicate":
      return tsTypePredicate(node);
    case "TSTypeParameterInstantiation":
      return tsTypeParameterInstantiation(node);
    case "TSTypeParameter":
      return tsTypeParameter(node);
    case "TSTypeParameterDeclaration":
      return tsTypeParameterDeclaration(node);
    case "TSEnumDeclaration":
      return tsEnumDeclaration(node);
    case "TSEnumBody":
      return ss(node.members);
    case "TSEnumMember":
      return tsEnumMember(node);
    case "TSTypeAliasDeclaration":
      return tsTypeAliasDeclaration(node);
    case "TSInterfaceDeclaration":
      return tsInterfaceDeclaration(node);
    case "TSInterfaceBody":
      return ss(node.body);
    case "TSInterfaceHeritage":
      return tsInterfaceHeritage(node);
    case "TSModuleDeclaration":
      return tsModuleDeclaration(node);
    case "TSModuleBlock":
      return tsModuleBlock(node);
    case "TSExportAssignment":
      return tsExportAssignment(node);
    case "TSNamespaceExportDeclaration":
      return tsNamespaceExportDeclaration(node);
    case "TSImportEqualsDeclaration":
      return tsImportEqualsDeclaration(node);
    case "TSExternalModuleReference":
      return tsExternalModuleReference(node);
    case "TSAnyKeyword":
      return `any`;
    case "TSBigIntKeyword":
      return `bigint`;
    case "TSBooleanKeyword":
      return `boolean`;
    case "TSIntrinsicKeyword":
      return `intrinsic`;
    case "TSNeverKeyword":
      return `never`;
    case "TSNullKeyword":
      return `null`;
    case "TSNumberKeyword":
      return `number`;
    case "TSObjectKeyword":
      return `object`;
    case "TSStringKeyword":
      return `string`;
    case "TSSymbolKeyword":
      return `symbol`;
    case "TSUndefinedKeyword":
      return `undefined`;
    case "TSUnknownKeyword":
      return `unknown`;
    case "TSVoidKeyword":
      return `void`;
    case "TSThisType":
      return `this`;
    case "TSJSDocNullableType":
      return `jsDocNullable(${s(node.typeAnnotation)})`;
    case "TSJSDocNonNullableType":
      return `jsDocNonNullable(${s(node.typeAnnotation)})`;
    case "TSJSDocUnknownType":
      return `jsDocUnknown`;
    default:
      return `unknown`;
  }
}

export const nodeNormalizer = {
  stringify,
  stringLiteral,
  regExpLiteral,
  numericLiteral,
  booleanLiteral,
  nullLiteral,
  bigintLiteral,
  identifierReference,
  identifierName,
  tsTypeAliasDeclaration,
  throwStatement,
  tsTypeAnnotation,
  functionNode,
  tsEnumDeclaration,
  arrayExpression,
};
