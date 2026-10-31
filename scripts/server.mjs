import http from "node:http";
import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { resolve, extname } from "node:path";
import { randomBytes } from "node:crypto";
import { networkInterfaces } from "node:os";
import { validateStore, mergeStores, emptyStore } from "../src/store.ts";
const root = resolve(process.env.GROVE_WEB_DIR || "dist");
const dataDir = resolve(process.env.GROVE_DATA_DIR || ".grove-data");
mkdirSync(dataDir, { recursive: true });
const dataFile = resolve(dataDir, "learning.json");
let state = emptyStore();
if (existsSync(dataFile)) {
  state = JSON.parse(readFileSync(dataFile, "utf8"));
  if (!validateStore(state))
    throw new Error(
      "Stored learning data is invalid. Preserve it before repairing.",
    );
}
const token = process.env.GROVE_TOKEN || randomBytes(16).toString("hex");
const port = Number(process.env.PORT || 5173);
const send = (res, status, body, type = "application/json") => {
  res.writeHead(status, {
    "Content-Type": type + "; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(
    typeof body === "string" || Buffer.isBuffer(body)
      ? body
      : JSON.stringify(body),
  );
};
const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://localhost").pathname;
    if (path === "/api/health" && req.method === "GET")
      return send(res, 200, { service: "grove-lan", version: 2 });
    if (path === "/api/sync") {
      if (req.method !== "POST")
        return send(res, 405, { error: "POST required" });
      if (req.headers.authorization !== `Bearer ${token}`)
        return send(res, 401, { error: "Pairing code required" });
      if (
        req.headers.origin &&
        new URL(req.headers.origin).host !== req.headers.host
      )
        return send(res, 403, { error: "Origin not allowed" });
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 4 * 1024 * 1024)
          return send(res, 413, { error: "Backup too large" });
        chunks.push(chunk);
      }
      let remote;
      try {
        remote = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        return send(res, 400, { error: "Invalid JSON" });
      }
      if (!validateStore(remote))
        return send(res, 400, { error: "Invalid learning data" });
      const merged = mergeStores(state, remote);
      if (!validateStore(merged))
        return send(res, 413, { error: "Too many records" });
      writeFileSync(dataFile + ".tmp", JSON.stringify(merged), "utf8");
      renameSync(dataFile + ".tmp", dataFile);
      state = merged;
      return send(res, 200, state);
    }
    if (path.startsWith("/api/"))
      return send(res, 404, { error: "Unknown endpoint" });
    if (!["GET", "HEAD"].includes(req.method))
      return send(res, 405, { error: "Method not allowed" });
    const requested = resolve(root, "." + decodeURIComponent(path));
    if (requested !== root && !requested.startsWith(root + "/"))
      return send(res, 403, "Forbidden", "text/plain");
    const file =
      existsSync(requested) && extname(requested)
        ? requested
        : resolve(root, "index.html");
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".webmanifest": "application/manifest+json",
    };
    const body = readFileSync(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    if (!res.headersSent)
      send(res, 500, { error: "Request failed; existing data preserved" });
    else res.end();
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(port, "0.0.0.0", () => {
  console.log(`English Grove: http://localhost:${port}`);
  for (const nets of Object.values(networkInterfaces()))
    for (const net of nets || [])
      if (net.family === "IPv4" && !net.internal)
        console.log(`LAN: http://${net.address}:${port}`);
  console.log(`Pairing code: ${token}`);
  console.log("Trusted private LAN only. Keep this process running.");
});
