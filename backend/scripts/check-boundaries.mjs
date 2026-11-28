/**
 * Dependency-boundary check (Phase 1).
 *
 * Fails when an import crosses an enforced layer boundary:
 * - domain must not import application, infrastructure, presentation, lib/prisma, or @prisma/client.
 * - application must not import presentation.
 * - infrastructure must not import application or presentation.
 * - presentation must not import infrastructure, lib/prisma, or @prisma/client.
 *
 * Run with: npm run check:boundaries
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const LAYERS = ["domain", "application", "infrastructure", "presentation"];

/** from-layer -> layers it must not import */
const FORBIDDEN = {
  domain: new Set(["application", "infrastructure", "presentation"]),
  application: new Set(["presentation"]),
  infrastructure: new Set(["application", "presentation"]),
  presentation: new Set(["infrastructure"]),
};

/** from-layer -> relative src subpaths it must not import */
const FORBIDDEN_INTERNAL = {
  domain: ["lib/prisma"],
  presentation: ["lib/prisma"],
};

/** from-layer -> external packages it must not import */
const FORBIDDEN_PACKAGES = {
  domain: new Set(["@prisma/client"]),
  presentation: new Set(["@prisma/client"]),
};

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

function layerOf(absPath) {
  const [first] = relative(SRC, absPath).split(/[\\/]/);
  return LAYERS.includes(first) ? first : null;
}

function importSpecifiers(source) {
  const specs = [];
  const pattern = /(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g;
  let match;
  while ((match = pattern.exec(source)) !== null) specs.push(match[1]);
  return specs;
}

const violations = [];

for (const file of walk(SRC)) {
  if (file.endsWith(".test.ts")) continue;

  const fromLayer = layerOf(file);
  if (!fromLayer) continue;

  const source = readFileSync(file, "utf8");
  for (const spec of importSpecifiers(source)) {
    if (!spec.startsWith(".")) {
      if (FORBIDDEN_PACKAGES[fromLayer]?.has(spec)) {
        violations.push(`${relative(SRC, file)} imports ${spec} from ${fromLayer}`);
      }
      continue;
    }

    const target = resolve(dirname(file), spec);
    const relTarget = relative(SRC, target).replace(/\\/g, "/");
    for (const forbiddenSubpath of FORBIDDEN_INTERNAL[fromLayer] ?? []) {
      if (relTarget === forbiddenSubpath || relTarget.startsWith(`${forbiddenSubpath}.`) || relTarget.startsWith(`${forbiddenSubpath}/`)) {
        violations.push(`${relative(SRC, file)} imports ${forbiddenSubpath} from ${fromLayer}`);
      }
    }

    const toLayer = layerOf(target);
    if (!toLayer || toLayer === fromLayer) continue;

    if (FORBIDDEN[fromLayer]?.has(toLayer)) {
      violations.push(
        `${relative(SRC, file)} imports ${toLayer} (${fromLayer} -> ${toLayer})`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error("Layer boundary violations:\n");
  for (const violation of violations) console.error(`  - ${violation}`);
  console.error(`\n${violations.length} violation(s).`);
  process.exit(1);
}

console.log("Layer boundaries OK.");
