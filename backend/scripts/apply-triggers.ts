import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sqlPath = resolve(process.cwd(), "prisma/sql/post-migrate.sql");
const sql = readFileSync(sqlPath, "utf8");

const result = spawnSync(
  "docker",
  ["exec", "-i", "awra_amba_db", "psql", "-U", "awra_amba", "-d", "awra_amba_textile"],
  { input: sql, encoding: "utf8" },
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status !== 0) {
  console.error("Failed to apply triggers via docker exec psql");
  process.exit(result.status ?? 1);
}

console.log("Triggers applied successfully.");