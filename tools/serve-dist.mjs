import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
};

function resolvePath(url) {
  const cleanUrl = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const requested = path.normalize(cleanUrl).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, requested === "/" ? "index.html" : requested);
  return filePath.startsWith(root) ? filePath : path.join(root, "index.html");
}

const server = createServer(async (request, response) => {
  let filePath = resolvePath(request.url || "/");

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = path.join(filePath, "index.html");
  } catch {
    filePath = path.join(root, "index.html");
  }

  const ext = path.extname(filePath);
  response.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream");
  createReadStream(filePath)
    .on("error", () => {
      response.statusCode = 404;
      response.end("Not found");
    })
    .pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static preview: http://127.0.0.1:${port}/`);
});
