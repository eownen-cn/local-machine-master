import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
const isPS = process.argv.includes("--powershell");
const port = isPS ? 5188 : 5187;
const dir = mkdtempSync(join(tmpdir(), "grove-sync-"));
let child;
const start = () =>
  new Promise((resolvePromise, reject) => {
    let output = "";
    const args = isPS
      ? [
          "-NoProfile",
          "-File",
          resolve("build-windows/Start.ps1"),
          "-Port",
          String(port),
          "-NoBrowser",
          "-DataDirectory",
          dir,
        ]
      : ["--experimental-strip-types", "scripts/server.mjs"];
    child = spawn(isPS ? process.env.PWSH || "pwsh" : process.execPath, args, {
      env: { ...process.env, PORT: String(port), GROVE_DATA_DIR: dir },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const timeout = setTimeout(
      () => reject(new Error("Server startup timed out: " + output)),
      15000,
    );
    const receive = (data) => {
      output += data.toString();
      const token = output.match(/Pairing code: ([a-f0-9]+)/)?.[1];
      if (token) {
        clearTimeout(timeout);
        resolvePromise(token);
      }
    };
    child.stdout.on("data", receive);
    child.stderr.on("data", receive);
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code) reject(new Error("Server exited: " + output));
    });
  });
const stop = () =>
  new Promise((r) => {
    if (!child || child.exitCode !== null) return r();
    child.once("exit", r);
    child.kill("SIGTERM");
  });
const api = async (token, state, extra = {}) =>
  fetch(`http://127.0.0.1:${port}/api/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...extra,
    },
    body: JSON.stringify(state),
  });
try {
  let token = await start();
  const empty = { version: 2, entries: {} };
  assert.equal(
    (await fetch(`http://127.0.0.1:${port}/api/health`)).status,
    200,
  );
  assert.equal((await api("wrong", empty)).status, 401);
  let r = await api(token, {
    version: 2,
    entries: {
      "word:test": {
        at: 1,
        value: {
          word: "hello",
          meaning: "你好",
          example: "Hello, world.",
          source: "测试",
        },
      },
    },
  });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).entries["word:test"].value.meaning, "你好");
  r = await api(token, {
    version: 2,
    entries: { "done:morning:grammar": { at: 2, value: true } },
  });
  let state = await r.json();
  assert.equal(Object.keys(state.entries).length, 2);
  assert.equal(
    (
      await api(token, {
        version: 2,
        entries: { "pref:daily": { at: 3, value: 999 } },
      })
    ).status,
    400,
  );
  assert.equal(
    (await api(token, empty, { Origin: "http://evil.example" })).status,
    403,
  );
  r = await api(token, {
    version: 2,
    entries: { "word:test": { at: 4, value: null } },
  });
  assert.equal((await r.json()).entries["word:test"].value, null);
  r = await api(token, {
    version: 2,
    entries: {
      "word:test": {
        at: 1,
        value: {
          word: "hello",
          meaning: "你好",
          example: "Hello.",
          source: "旧数据",
        },
      },
    },
  });
  assert.equal((await r.json()).entries["word:test"].value, null);
  await stop();
  token = await start();
  r = await api(token, empty);
  state = await r.json();
  assert.equal(state.entries["done:morning:grammar"].value, true);
  assert.equal(state.entries["word:test"].value, null);
  console.log(
    `${isPS ? "PowerShell" : "Node"} sync: 9 checks passed (auth, UTF-8, merge, validation, origin, deletion, stale-write, persistence, health)`,
  );
} finally {
  await stop();
  rmSync(dir, { recursive: true, force: true });
}
