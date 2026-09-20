import { createRequire } from "node:module";
import type {
  CompatData,
  CompatStatement,
  Identifier as BcdIdentifier,
  SimpleSupportStatement,
  SupportStatement,
} from "@mdn/browser-compat-data/types";
import type {
  BrowserConflict,
  BrowserTarget,
  Conflict,
  FoundFeature,
} from "./types.js";
import { compareVersions, minVersion, normalizeVersion } from "./version.js";

const require = createRequire(import.meta.url);
const bcd = require("@mdn/browser-compat-data") as CompatData;

const INSTANCE_GLOBALS: Record<string, string> = {
  navigator: "Navigator",
  document: "Document",
  location: "Location",
  history: "History",
  localStorage: "Storage",
  sessionStorage: "Storage",
  crypto: "Crypto",
  performance: "Performance",
  screen: "Screen",
  console: "console",
  indexedDB: "IDBFactory",
  caches: "CacheStorage",
  customElements: "CustomElementRegistry",
  visualViewport: "VisualViewport",
  speechSynthesis: "SpeechSynthesis",
  scheduler: "Scheduler",
};

const COMMON_API_INTERFACES = new Set([
  "AbortController",
  "AbortSignal",
  "Animation",
  "Blob",
  "Cache",
  "CacheStorage",
  "CanvasRenderingContext2D",
  "CharacterData",
  "Clipboard",
  "CSSStyleDeclaration",
  "CSSStyleSheet",
  "CustomElementRegistry",
  "DataTransfer",
  "Document",
  "DocumentFragment",
  "DOMRect",
  "DOMTokenList",
  "Element",
  "Event",
  "EventTarget",
  "File",
  "FormData",
  "Headers",
  "History",
  "HTMLAnchorElement",
  "HTMLCanvasElement",
  "HTMLCollection",
  "HTMLDialogElement",
  "HTMLElement",
  "HTMLFormElement",
  "HTMLIFrameElement",
  "HTMLImageElement",
  "HTMLInputElement",
  "HTMLMediaElement",
  "HTMLSelectElement",
  "HTMLTemplateElement",
  "HTMLTextAreaElement",
  "IDBDatabase",
  "IDBObjectStore",
  "IntersectionObserver",
  "KeyboardEvent",
  "Location",
  "MediaDevices",
  "MediaQueryList",
  "MessagePort",
  "MouseEvent",
  "MutationObserver",
  "Navigator",
  "Node",
  "NodeList",
  "Notification",
  "Performance",
  "PointerEvent",
  "Range",
  "ReadableStream",
  "Request",
  "ResizeObserver",
  "Response",
  "Screen",
  "Selection",
  "ServiceWorkerContainer",
  "ShadowRoot",
  "Storage",
  "SubtleCrypto",
  "Text",
  "TextDecoder",
  "TextEncoder",
  "URL",
  "URLSearchParams",
  "VisualViewport",
  "WebSocket",
  "Window",
  "Worker",
  "WritableStream",
  "console",
]);

interface Candidate {
  path: string;
  label: string;
  compat: CompatStatement;
}

interface Evaluation {
  conflicts: BrowserConflict[];
  hasData: boolean;
}

interface MatchResult {
  conflicts: Conflict[];
  matchedFeatureCount: number;
}

export function matchFeatures(
  features: FoundFeature[],
  targets: BrowserTarget[],
): MatchResult {
  const index = getMemberIndex();
  const conflicts: Conflict[] = [];
  const seen = new Set<string>();
  const cssPropertyConflicts = new Map<string, string>();
  let matchedFeatureCount = 0;

  for (const feature of features) {
    const candidates = resolveCandidates(feature, index);
    if (candidates.length === 0) continue;
    matchedFeatureCount += 1;

    const conflict = evaluateCandidates(feature, candidates, targets);
    if (!conflict) continue;

    const key = `${conflict.filePath}:${conflict.line}:${conflict.bcdPath}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const declKey = `${feature.filePath}:${feature.line}:${feature.name}`;
    const serialized = JSON.stringify(conflict.browsers);
    if (feature.kind === "css-property") {
      cssPropertyConflicts.set(declKey, serialized);
    } else if (
      feature.kind === "css-value" &&
      cssPropertyConflicts.get(declKey) === serialized
    ) {
      continue;
    }

    conflicts.push(conflict);
  }

  conflicts.sort(
    (a, b) =>
      a.filePath.localeCompare(b.filePath) ||
      a.line - b.line ||
      a.column - b.column,
  );
  return { conflicts, matchedFeatureCount };
}

function resolveCandidates(
  feature: FoundFeature,
  index: MemberIndex,
): Candidate[] {
  switch (feature.kind) {
    case "member":
      return resolveMember(feature, index);
    case "new":
      return firstFound([
        [`api.${feature.name}`, feature.name],
        [`javascript.builtins.${feature.name}`, feature.name],
      ]);
    case "identifier":
      return resolveIdentifier(feature.name);
    case "css-property":
      return resolveCssProperty(feature.name);
    case "css-value":
      return resolveCssValue(feature.name, feature.value ?? "");
    case "css-at-rule":
      return firstFound([[`css.at-rules.${feature.name}`, `@${feature.name}`]]);
    default:
      return [];
  }
}

function resolveIdentifier(name: string): Candidate[] {
  const paths: Array<[string, string]> = [
    [`api.${name}`, name],
    [`api.Window.${name}`, name],
    [`javascript.builtins.${name}`, name],
  ];
  const iface = INSTANCE_GLOBALS[name];
  if (iface) paths.push([`api.${iface}`, name]);
  return firstFound(paths);
}

function resolveMember(feature: FoundFeature, index: MemberIndex): Candidate[] {
  const { object, name } = feature;

  if (object) {
    const iface = INSTANCE_GLOBALS[object];
    const direct = firstFound([
      ...(iface
        ? [[`api.${iface}.${name}`, `${object}.${name}`] as [string, string]]
        : []),
      [`javascript.builtins.${object}.${name}`, `${object}.${name}`],
      [`javascript.builtins.${object}.${name}_static`, `${object}.${name}`],
      [`javascript.builtins.Intl.${object}.${name}`, `Intl.${object}.${name}`],
      [`api.${object}.${name}_static`, `${object}.${name}`],
      [`api.${object}.${name}`, `${object}.${name}`],
    ]);
    if (direct.length > 0) return direct;
  }

  return index.get(name) ?? [];
}

function resolveCssProperty(prop: string): Candidate[] {
  if (prop.startsWith("-")) return [];
  return firstFound([[`css.properties.${prop}`, prop]]);
}

function resolveCssValue(prop: string, rawValue: string): Candidate[] {
  if (prop.startsWith("-")) return [];
  const propNode = getNode(`css.properties.${prop}`);
  if (!propNode) return [];

  const value = rawValue
    .toLowerCase()
    .replace(/\s*!important\s*$/, "")
    .trim();
  const candidates: Candidate[] = [];
  const pushIfExists = (path: string, label: string) => {
    const compat = getCompat(path);
    if (compat && !candidates.some((c) => c.path === path))
      candidates.push({ path, label, compat });
  };

  if (/^[a-z][a-z0-9-]*$/.test(value)) {
    pushIfExists(`css.properties.${prop}.${value}`, `${prop}: ${value}`);
    return candidates;
  }

  for (const token of value.split(/[\s,/]+/)) {
    if (/^[a-z][a-z0-9-]*$/.test(token)) {
      pushIfExists(`css.properties.${prop}.${token}`, `${prop}: ${token}`);
    }
  }
  for (const match of value.matchAll(/([a-z][a-z0-9-]*)\(/g)) {
    const fn = match[1]!;
    pushIfExists(`css.properties.${prop}.${fn}`, `${prop}: ${fn}()`);
    pushIfExists(`css.types.${fn}`, `${fn}()`);
    pushIfExists(`css.types.color.${fn}`, `${fn}()`);
  }
  return candidates;
}

function firstFound(paths: Array<[path: string, label: string]>): Candidate[] {
  for (const [path, label] of paths) {
    const compat = getCompat(path);
    if (compat) return [{ path, label, compat }];
  }
  return [];
}

function evaluateCandidates(
  feature: FoundFeature,
  candidates: Candidate[],
  targets: BrowserTarget[],
): Conflict | null {
  const evaluations = candidates.map((candidate) => ({
    candidate,
    evaluation: evaluate(candidate.compat, targets),
  }));
  const withData = evaluations.filter((e) => e.evaluation.hasData);
  if (withData.length === 0) return null;

  const browserConflicts: BrowserConflict[] = [];
  for (const target of targets) {
    const perCandidate = withData.map((e) =>
      e.evaluation.conflicts.find((c) => c.browser === target.browserslistName),
    );
    if (perCandidate.some((c) => c === undefined)) continue;
    const merged = perCandidate.reduce<BrowserConflict>((acc, current) => {
      if (!current) return acc;
      if (acc.requiredVersion === null)
        return current.requiredVersion === null ? acc : current;
      if (current.requiredVersion === null) return acc;
      return {
        ...acc,
        requiredVersion: minVersion(
          acc.requiredVersion,
          current.requiredVersion,
        ),
      };
    }, perCandidate[0]!);
    browserConflicts.push(merged);
  }

  if (browserConflicts.length === 0) return null;

  const primary = withData[0]!.candidate;
  const feature_ =
    withData.length === 1
      ? primary.label
      : `.${feature.name} (${withData.map((e) => ownerName(e.candidate.path)).join(" | ")})`;

  return {
    filePath: feature.filePath,
    line: feature.line,
    column: feature.column,
    feature: feature_,
    bcdPath:
      withData.length === 1
        ? primary.path
        : withData.map((e) => e.candidate.path).join(" | "),
    mdnUrl: primary.compat.mdn_url ?? null,
    browsers: browserConflicts,
  };
}

function evaluate(
  compat: CompatStatement,
  targets: BrowserTarget[],
): Evaluation {
  const conflicts: BrowserConflict[] = [];
  let hasData = false;

  for (const target of targets) {
    if (!target.bcdName) continue;
    const raw = compat.support[
      target.bcdName as keyof typeof compat.support
    ] as SupportStatement | undefined;
    if (!raw) continue;

    const statements = (Array.isArray(raw) ? raw : [raw]).filter(
      isPlainStatement,
    );
    const definitive = statements.filter(
      (s) => s.version_added !== null && s.version_added !== undefined,
    );
    const allUnknown = statements.length > 0 && definitive.length === 0;
    if (allUnknown) continue;
    hasData = true;

    const supported = definitive.some((s) =>
      supportsVersion(s, target.version),
    );
    if (supported) continue;

    conflicts.push({
      browser: target.browserslistName,
      bcdBrowser: target.bcdName,
      targetVersion: target.version,
      requiredVersion: lowestVersionAdded(definitive),
    });
  }

  return { conflicts, hasData };
}

function isPlainStatement(statement: SimpleSupportStatement): boolean {
  return !statement.prefix && !statement.flags && !statement.alternative_name;
}

function supportsVersion(
  statement: SimpleSupportStatement,
  target: string,
): boolean {
  const added = statement.version_added;
  if (added === false || added === null || added === undefined) return false;
  if ((added as unknown) === true) return true;
  const addedVersion = normalizeVersion(added);
  if (!addedVersion) return false;
  if (compareVersions(target, addedVersion) < 0) return false;

  const removed = statement.version_removed;
  if (typeof removed === "string") {
    const removedVersion = normalizeVersion(removed);
    if (removedVersion && compareVersions(target, removedVersion) >= 0)
      return false;
  }
  return true;
}

function lowestVersionAdded(
  statements: SimpleSupportStatement[],
): string | null {
  let lowest: string | null = null;
  for (const statement of statements) {
    if (typeof statement.version_added !== "string") continue;
    if (statement.version_removed) continue;
    const version = normalizeVersion(statement.version_added);
    if (!version) continue;
    lowest = lowest ? minVersion(lowest, version) : version;
  }
  return lowest;
}

function getNode(path: string): BcdIdentifier | null {
  let node: unknown = bcd;
  for (const segment of path.split(".")) {
    if (!node || typeof node !== "object") return null;
    node = (node as Record<string, unknown>)[segment];
  }
  return node && typeof node === "object" ? (node as BcdIdentifier) : null;
}

function getCompat(path: string): CompatStatement | null {
  const node = getNode(path);
  return node?.__compat ?? null;
}

function ownerName(path: string): string {
  const parts = path.split(".");
  return parts[parts.length - 2] ?? path;
}

type MemberIndex = Map<string, Candidate[]>;
let memberIndex: MemberIndex | null = null;

function getMemberIndex(): MemberIndex {
  if (memberIndex) return memberIndex;
  const index: MemberIndex = new Map();

  const add = (
    memberName: string,
    path: string,
    label: string,
    compat: CompatStatement,
  ) => {
    const list = index.get(memberName) ?? [];
    list.push({ path, label, compat });
    index.set(memberName, list);
  };

  const walkOwner = (
    ownerPath: string,
    ownerLabel: string,
    owner: BcdIdentifier,
    protoLabel: boolean,
  ) => {
    for (const [key, child] of Object.entries(owner)) {
      if (key === "__compat" || !child || typeof child !== "object") continue;
      const compat = (child as BcdIdentifier).__compat;
      if (!compat) continue;
      if (key.endsWith("_event") || key.includes("@@") || key.startsWith("@"))
        continue;
      if (compat.status?.deprecated) continue;
      const memberName = key.endsWith("_static")
        ? key.slice(0, -"_static".length)
        : key;
      const isStatic = key.endsWith("_static");
      const label =
        isStatic || !protoLabel
          ? `${ownerLabel}.${memberName}`
          : `${ownerLabel}.prototype.${memberName}`;
      add(memberName, `${ownerPath}.${key}`, label, compat);
    }
  };

  const builtins = bcd.javascript?.builtins as unknown as
    | Record<string, BcdIdentifier>
    | undefined;
  if (builtins) {
    for (const [ctor, node] of Object.entries(builtins)) {
      if (!node || typeof node !== "object") continue;
      walkOwner(`javascript.builtins.${ctor}`, ctor, node, true);
      if (ctor === "Intl") {
        for (const [sub, subNode] of Object.entries(node)) {
          if (sub === "__compat" || !subNode || typeof subNode !== "object")
            continue;
          walkOwner(
            `javascript.builtins.Intl.${sub}`,
            `Intl.${sub}`,
            subNode as BcdIdentifier,
            true,
          );
        }
      }
    }
  }

  const api = bcd.api as unknown as Record<string, BcdIdentifier> | undefined;
  if (api) {
    for (const [iface, node] of Object.entries(api)) {
      if (
        !node ||
        typeof node !== "object" ||
        !COMMON_API_INTERFACES.has(iface)
      )
        continue;
      walkOwner(`api.${iface}`, iface, node, false);
    }
  }

  memberIndex = index;
  return index;
}
