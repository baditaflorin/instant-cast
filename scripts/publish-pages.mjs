import { cpSync, existsSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const distDir = "dist";
const docsDir = "docs";
const generatedPaths = [
  "assets",
  "index.html",
  "404.html",
  "icon.svg",
  "manifest.webmanifest",
  "sw.js",
  "vite.svg",
];

if (!existsSync(join(distDir, "index.html"))) {
  throw new Error("dist/index.html does not exist after build");
}

mkdirSync(docsDir, { recursive: true });

for (const generatedPath of generatedPaths) {
  rmSync(join(docsDir, generatedPath), { recursive: true, force: true });
}

cpSync(distDir, docsDir, { recursive: true });
copyFileSync(join(docsDir, "index.html"), join(docsDir, "404.html"));
