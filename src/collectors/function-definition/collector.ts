import {
  createCollector,
  extractSnippet,
  formatId,
  getPosition,
} from "../../utils/index.js";

type Scope = Map<string, string>;

type NormalizationState = {
  scopes: Scope[];
  counter: {
    value: number;
  };
};

const FUNCTION_NODE_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

const BLOCKED_IDENTIFIER_CONTEXTS = new Set([
  "MemberExpression.property",
  "MethodDefinition.key",
  "Property.key",
  "PropertyDefinition.key",
  "LabeledStatement.label",
  "BreakStatement.label",
  "ContinueStatement.label",
]);

export const functionDefinitionCollector = createCollector(
  (context, filePath, sourceCode) => {
    let counter = 0;

    const collectFunction = (node: any): void => {
      if (!node.body) {
        return;
      }

      const normalized = normalizeFunctionNode(node);
      const location = {
        file: filePath,
        start: getPosition(sourceCode, node.start),
        end: getPosition(sourceCode, node.end),
      };
      const snippet = extractSnippet(sourceCode, location, { expandLines: 2 });
      const raw = sourceCode.slice(node.start, node.end);

      context.addInfo(
        normalized,
        formatId(filePath, counter++),
        location,
        snippet,
        { normalized, raw },
      );
    };

    return {
      FunctionDeclaration: collectFunction,
      FunctionExpression: collectFunction,
      ArrowFunctionExpression: collectFunction,
    };
  },
);

function normalizeFunctionNode(
  node: any,
  parentState?: NormalizationState,
): string {
  return JSON.stringify(serializeFunctionNode(node, parentState));
}

function serializeFunctionNode(
  node: any,
  parentState?: NormalizationState,
): Record<string, unknown> {
  const state: NormalizationState = {
    scopes: [...(parentState?.scopes ?? []), new Map()],
    counter: parentState?.counter ?? { value: 1 },
  };

  if (node.id?.type === "Identifier") {
    declareBinding(node.id.name, state);
  }

  for (const param of node.params ?? []) {
    declarePatternBindings(param, state);
  }

  if (node.body?.type === "BlockStatement") {
    collectBindingsFromNode(node.body, state);
  }

  const normalized = normalizeObjectNode(node, state);
  normalized.id = null;

  return normalized;
}

function normalizeNode(
  value: unknown,
  state: NormalizationState,
  parent?: any,
  key?: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeNode(item, state, parent, key));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const node = value as Record<string, any>;

  if (typeof node.type === "string" && FUNCTION_NODE_TYPES.has(node.type)) {
    return serializeFunctionNode(node, state);
  }

  if (node.type === "Identifier") {
    return normalizeIdentifier(node, state, parent, key);
  }

  return normalizeObjectNode(node, state);
}

function normalizeObjectNode(
  node: Record<string, any>,
  state: NormalizationState,
) {
  const result: Record<string, unknown> = {};

  for (const currentKey of Object.keys(node).sort()) {
    if (shouldSkipKey(currentKey)) {
      continue;
    }

    result[currentKey] = normalizeNode(
      node[currentKey],
      state,
      node,
      currentKey,
    );
  }

  return result;
}

function normalizeIdentifier(
  node: Record<string, any>,
  state: NormalizationState,
  parent?: Record<string, any>,
  key?: string,
) {
  if (shouldKeepIdentifierName(parent, key)) {
    return { type: node.type, name: node.name };
  }

  const bindingName = resolveBinding(node.name, state);

  return {
    type: node.type,
    name: bindingName ?? node.name,
  };
}

function shouldKeepIdentifierName(
  parent?: Record<string, any>,
  key?: string,
): boolean {
  if (!parent || !key || typeof parent.type !== "string") {
    return false;
  }

  if (
    parent.type === "MemberExpression" &&
    key === "property" &&
    parent.computed
  ) {
    return false;
  }

  return BLOCKED_IDENTIFIER_CONTEXTS.has(`${parent.type}.${key}`);
}

function shouldSkipKey(key: string): boolean {
  return key === "start" || key === "end" || key === "loc" || key === "raw";
}

function declareBinding(name: string, state: NormalizationState): string {
  const currentScope = state.scopes[state.scopes.length - 1];
  const existing = currentScope.get(name);

  if (existing) {
    return existing;
  }

  const bindingName = `$${state.counter.value++}`;
  currentScope.set(name, bindingName);
  return bindingName;
}

function resolveBinding(
  name: string,
  state: NormalizationState,
): string | undefined {
  for (let index = state.scopes.length - 1; index >= 0; index--) {
    const bindingName = state.scopes[index].get(name);
    if (bindingName) {
      return bindingName;
    }
  }

  return undefined;
}

function declarePatternBindings(pattern: any, state: NormalizationState): void {
  if (!pattern || typeof pattern !== "object") {
    return;
  }

  switch (pattern.type) {
    case "Identifier":
      declareBinding(pattern.name, state);
      return;
    case "RestElement":
      declarePatternBindings(pattern.argument, state);
      return;
    case "AssignmentPattern":
      declarePatternBindings(pattern.left, state);
      return;
    case "ArrayPattern":
      for (const element of pattern.elements ?? []) {
        declarePatternBindings(element, state);
      }
      return;
    case "ObjectPattern":
      for (const property of pattern.properties ?? []) {
        if (property?.type === "Property") {
          declarePatternBindings(property.value, state);
        } else {
          declarePatternBindings(property, state);
        }
      }
      return;
    case "TSParameterProperty":
      declarePatternBindings(pattern.parameter, state);
      return;
    default:
      return;
  }
}

function collectBindingsFromNode(node: any, state: NormalizationState): void {
  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectBindingsFromNode(item, state);
    }
    return;
  }

  switch (node.type) {
    case "FunctionDeclaration":
      if (node.id?.type === "Identifier") {
        declareBinding(node.id.name, state);
      }
      return;
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      return;
    case "VariableDeclarator":
      declarePatternBindings(node.id, state);
      collectBindingsFromNode(node.init, state);
      return;
    case "ClassDeclaration":
      if (node.id?.type === "Identifier") {
        declareBinding(node.id.name, state);
      }
      return;
    case "CatchClause":
      declarePatternBindings(node.param, state);
      collectBindingsFromNode(node.body, state);
      return;
    default:
      for (const [key, value] of Object.entries(node)) {
        if (
          key === "start" ||
          key === "end" ||
          key === "loc" ||
          key === "raw"
        ) {
          continue;
        }
        collectBindingsFromNode(value, state);
      }
  }
}
