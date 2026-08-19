import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.DEMO_PORT || 4174);
const routes = new Map([
  ["/", { file: path.join(root, "demo/index.html"), type: "text/html; charset=utf-8" }],
  ["/extension/customia-3d.css", { file: path.join(root, "extensions/customia-3d-product/assets/customia-3d.css"), type: "text/css; charset=utf-8" }],
  ["/extension/customia-3d.js", { file: path.join(root, "extensions/customia-3d-product/assets/customia-3d.js"), type: "text/javascript; charset=utf-8" }],
  ["/sample.jpg", { file: path.join(root, "demo/sample-pug.jpg"), type: "image/jpeg" }],
]);

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url || "/", "http://localhost").pathname;
  const route = routes.get(pathname);
  if (!route) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  try {
    const file = await stat(route.file);
    response.writeHead(200, {
      "Content-Type": route.type,
      "Content-Length": file.size,
      "Cache-Control": "no-store",
    });
    createReadStream(route.file).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Missing demo asset");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`CustomIA 3D demo: http://127.0.0.1:${port}`);
});
