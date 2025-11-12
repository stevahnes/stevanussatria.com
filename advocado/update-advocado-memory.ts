import "dotenv/config";
import { Langbase } from "langbase";
import fs from "fs";
import path from "path";

const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!,
});

const docNames = [
  ["../frontend/docs", "index.md"],
  ["../frontend/docs", "resume.md"],
  ["../frontend/docs", "projects.md"],
  ["../frontend/docs", "milestones.md"],
  ["../frontend/docs", "recommendations.md"],
  ["../frontend/docs", "stack.md"],
  ["../frontend/docs", "gear.md"],
  ["./private", "supplementary.md"],
];

async function main(subpath: string, docName: string) {
  const src = path.join(process.cwd(), subpath, docName);

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
docNames.forEach(([subpath, docName]) => {
  main(subpath, docName);
});
