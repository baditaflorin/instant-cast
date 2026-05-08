import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT ?? 4173);
const docsDir = "docs";
const basePath = "/instant-cast/";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".wasm": "application/wasm",
};

function resolvePath(urlPath) {
  if (urlPath === "/") return join(docsDir, "index.html");
  if (!urlPath.startsWith(basePath)) return null;

  const relative = urlPath.slice(basePath.length) || "index.html";
  const safePath = normalize(relative).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidate = join(docsDir, safePath);

  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return join(docsDir, "index.html");
}

createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const filePath = resolvePath(url.pathname);

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const contentType = contentTypes[extname(filePath)] ?? "application/octet-stream";
  response.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Serving docs at http://127.0.0.1:${port}${basePath}`);
});
