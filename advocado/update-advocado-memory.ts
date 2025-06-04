import "dotenv/config";
import { Langbase } from "langbase";
import fs from "fs";
import path from "path";

const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!,
});

const docNames = [
  "about.md",
  "milestones.md",
  "projects.md",
  "resume.md",
  "recommendations.md",
  "stack.md",
  "gear.md",
  "skyline.md",
];

async function main(docName: string) {
  const src = path.join(process.cwd(), "../frontend/docs", docName);

  const response = await langbase.memories.documents.upload({
    document: fs.readFileSync(src),
    memoryName: "advocado-memory",
    documentName: docName,
    contentType: "text/plain",
    meta: {
      extension: "md",
      description: "Steve's Portfolio Pages",
    },
  });

  console.log(response);
}
docNames.forEach((docName) => {
  main(docName);
});
