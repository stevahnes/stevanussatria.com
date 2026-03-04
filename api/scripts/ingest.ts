// scripts/ingest.ts
import "dotenv/config";
import fs from "fs";
import path from "path";
import { glob } from "glob";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// Files to summarize via AI instead of ingesting raw
const SUMMARIZE_FILES = [
  "loops.md",
  "skyline.md",
  "milestones.md",
  "recommendations.md",
];

function stripNoise(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(https?:\/\/.*?\)/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function summarizeFile(
  filename: string,
  content: string,
): Promise<string> {
  const { text } = await generateText({
    model: openai("gpt-5-nano"),
    prompt: `You are helping build context for a personal portfolio chatbot about Stevanus Satria (Steve).

Below is the raw content of the file "${filename}" from his portfolio site.

Summarize this into clean, natural prose that a chatbot could use to answer visitor questions about Steve.
- Focus on facts, themes, and what a visitor would reasonably ask about
- Write in third person ("Steve has...", "He is...")
- Omit technical scaffolding, IDs, dates unless meaningful, and boilerplate
- Keep it concise — a few short paragraphs at most

Raw content:
${content}`,
  });

  return `## ${filename}\n\n${text}`;
}

async function main() {
  const docsDir = path.join(__dirname, "../../frontend/docs");

  // --- 1. Ingest regular files ---
  const regularFiles = await glob("**/*.md", {
    cwd: docsDir,
    absolute: true,
    ignore: [
      "**/node_modules/**",
      "**/.vitepress/**",
      "**/components/**",
      "**/public/**",
      "ama.md",
      ...SUMMARIZE_FILES.map((f) => `**/${f}`),
    ],
  });

  const ingestedSections = regularFiles.map((f) => {
    const content = stripNoise(fs.readFileSync(f, "utf-8"));
    return `## ${path.basename(f, ".md")}\n\n${content}`;
  });

  console.log(`Ingested ${regularFiles.length} regular files.`);

  // --- 2. Summarize special files ---
  const summarizeTargets = await glob(
    SUMMARIZE_FILES.map((f) => `**/${f}`),
    { cwd: docsDir, absolute: true },
  );

  console.log(`Summarizing ${summarizeTargets.length} files via OpenAI...`);

  const summarizedSections: string[] = [];
  for (const f of summarizeTargets) {
    const filename = path.basename(f);
    const raw = fs.readFileSync(f, "utf-8");

    if (raw.length < 50) {
      console.log(`  Skipping ${filename} (too short after stripping)`);
      continue;
    }

    console.log(`  Summarizing ${filename}...`);
    const summary = await summarizeFile(filename, raw);
    summarizedSections.push(summary);
  }

  // --- 3. Combine and write ---
  const allSections = [...ingestedSections, ...summarizedSections];
  const context = allSections.join("\n\n---\n\n");

  fs.writeFileSync(
    path.join(__dirname, "../src/context.ts"),
    `export const SITE_CONTEXT = ${JSON.stringify(context)};\n`,
  );

  console.log(
    `\nDone. ${regularFiles.length} ingested + ${summarizedSections.length} summarized → context.ts`,
  );
}

main();
