import path from "node:path";
import { collectors } from "../collectors/index.js";
import { RuleCategory } from "./types.js";
import type { Rule } from "./types.js";

interface UnstableDependencyOptions {
  threshold: number;
}

export const unstableDependency: Rule<
  [typeof collectors.importDependency],
  UnstableDependencyOptions
> = {
  id: "unstable-dependency",
  category: RuleCategory.Coupling,
  collectors: [collectors.importDependency],
  defaultOptions: { threshold: 0.75 },
  descriptions: {
    violation:
      "`{{importer}}` (I={{importerI}}) depends on unstable `{{importee}}` (I={{importeeI}})",
  },
  check(context, [importGraph], options) {
    const { threshold } = options;

    // importer -> set of unique importees
    const dependsOn = new Map<string, Set<string>>();
    // importer -> importee -> first import location
    const importLocations = new Map<
      string,
      Map<string, import("../types/index.js").Location>
    >();

    for (const importedFile of importGraph.keys()) {
      const collections = importGraph.getByKey(importedFile);
      for (const { path: importer, location } of collections) {
        if (!dependsOn.has(importer)) dependsOn.set(importer, new Set());
        dependsOn.get(importer)!.add(importedFile);

        if (!importLocations.has(importer))
          importLocations.set(importer, new Map());
        const locMap = importLocations.get(importer)!;
        if (!locMap.has(importedFile)) locMap.set(importedFile, location);
      }
    }

    const fanIn = new Map<string, number>();
    for (const importees of dependsOn.values()) {
      for (const importee of importees) {
        fanIn.set(importee, (fanIn.get(importee) ?? 0) + 1);
      }
    }

    function instability(file: string): number {
      const fo = dependsOn.get(file)?.size ?? 0;
      const fi = fanIn.get(file) ?? 0;
      if (fo + fi === 0) return 0;
      return fo / (fi + fo);
    }

    for (const [importer, importees] of dependsOn) {
      const importerI = instability(importer);
      if (importerI >= threshold) continue;

      for (const importee of importees) {
        const importeeI = instability(importee);
        if (importeeI < threshold) continue;

        const location = importLocations.get(importer)?.get(importee);
        if (!location) continue;

        context.report({
          descriptionId: "violation",
          data: {
            importer: path.relative(process.cwd(), importer),
            importerI: importerI.toFixed(2),
            importee: path.relative(process.cwd(), importee),
            importeeI: importeeI.toFixed(2),
          },
          occurrences: [{ path: importer, location }],
        });
      }
    }
  },
};
