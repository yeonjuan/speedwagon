import type {
  JSXElement,
  JSXElementName,
  JSXAttributeItem,
  JSXAttribute,
  JSXAttributeValue,
  JSXChild,
} from "oxc-parser";
import { analyzeCrossFileDuplicates } from "./helpers.js";
import type { DuplicationsAnalyzer } from "./types.js";

function getTagName(name: JSXElementName): string {
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression")
    return `${getTagName(name.object)}.${name.property.name}`;
  if (name.type === "JSXNamespacedName")
    return `${name.namespace.name}:${name.name.name}`;
  return "?";
}

function serializeAttrValue(value: JSXAttributeValue): string {
  if (value.type === "Literal") return JSON.stringify(value.value);
  if (value.type === "JSXElement") return serializeJSXElement(value);
  return "{...}";
}

function serializeAttr(item: JSXAttributeItem): string {
  if (item.type === "JSXSpreadAttribute") return "{...}";
  const attr = item as JSXAttribute;
  const name =
    attr.name.type === "JSXIdentifier"
      ? attr.name.name
      : `${attr.name.namespace.name}:${attr.name.name.name}`;
  if (!attr.value) return name;
  return `${name}=${serializeAttrValue(attr.value)}`;
}

function serializeChild(child: JSXChild): string {
  if (child.type === "JSXText") return child.value.trim();
  if (child.type === "JSXElement") return serializeJSXElement(child);
  if (child.type === "JSXFragment") return "<>{...}</>";
  return "{...}";
}

function serializeJSXElement(el: JSXElement): string {
  const tag = getTagName(el.openingElement.name);
  const attrs = el.openingElement.attributes
    .map(serializeAttr)
    .sort()
    .join(" ");
  const attrStr = attrs ? ` ${attrs}` : "";

  if (el.openingElement.selfClosing) return `<${tag}${attrStr}/>`;

  const children = el.children.map(serializeChild).join("");
  return `<${tag}${attrStr}>${children}</${tag}>`;
}

export const jsxSvg: DuplicationsAnalyzer = {
  visitor(context) {
    return {
      JSXElement(node) {
        const name = node.openingElement.name;
        if (name.type !== "JSXIdentifier" || name.name !== "svg") return;
        const key = serializeJSXElement(node);
        context.collect({ key, display: "<svg>", offset: node.start });
      },
    };
  },
  analyze(context) {
    analyzeCrossFileDuplicates(context, () => "Duplicate JSX SVG component");
  },
};
