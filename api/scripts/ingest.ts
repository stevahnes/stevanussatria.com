// scripts/ingest.ts
import fs from "fs";
import path from "path";
import { glob } from "glob";

async function main() {
  const files = await glob("**/*.md", {
    cwd: path.join(__dirname, "../../frontend/docs"),
    absolute: true, // returns absolute paths so fs.readFileSync works reliably
    ignore: ["**/node_modules/**"],
  });
  const content = files
    .map((f) => fs.readFileSync(f, "utf-8"))
    .join("\n\n---\n\n");

  fs.writeFileSync(
    path.join(__dirname, "../src/context.ts"),
    `export const SITE_CONTEXT = ${JSON.stringify(content)};`,
  );

  console.log(`Ingested ${files.length} files into context.md`);
}

main();
