/**
 * Dependency-boundary check (Phase 0).
 *
 * Fails when an import crosses a layer boundary that is already clean today.
 * The remaining couplings (presentation -> lib/prisma, application -> prisma,
 * application -> infrastructure) are intentionally not enforced yet; they are
 * removed in Phases 1-2 and then added here.
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
    if (!spec.startsWith(".")) continue;

    const target = resolve(dirname(file), spec);
    const toLayer = layerOf(target);

    if (fromLayer === "domain" && relative(SRC, target).startsWith("lib/prisma")) {
      violations.push(`${relative(SRC, file)} imports lib/prisma from domain`);
    }

    if (!toLayer || toLayer === fromLayer) continue;

    if (FORBIDDEN[fromLayer]?.has(toLayer)) {
      violations.push(
        `${relative(SRC, file)} imports ${toLayer} (${fromLayer} -> ${toLayer})`,
      );
    }

    if (fromLayer === "domain" && relative(SRC, target).startsWith("lib/prisma")) {
      violations.push(`${relative(SRC, file)} imports lib/prisma from domain`);
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
