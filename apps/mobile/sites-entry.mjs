import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT ?? 8080);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ttf": "font/ttf"
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url ?? "/", `http://localhost:${port}`).pathname);
    const requested = resolve(join(root, urlPath));
    const file = requested.startsWith(root) && existsSync(requested) && statSync(requested).isFile() ? requested : join(root, "index.html");

    res.setHeader("Content-Type", types[extname(file)] ?? "application/octet-stream");
    createReadStream(file).pipe(res);
  })
  .listen(port, "0.0.0.0");
