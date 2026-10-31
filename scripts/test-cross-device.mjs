import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const ps = process.argv.includes("--powershell");
const port = 5190;
const dir = mkdtempSync(join(tmpdir(), "grove-devices-"));
let server, browser;
try {
  const token = await new Promise((resolvePromise, reject) => {
    let log = "";
    server = spawn(
      ps ? process.env.PWSH || "pwsh" : process.execPath,
      ps
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
        : ["--experimental-strip-types", "scripts/server.mjs"],
      {
        env: { ...process.env, PORT: String(port), GROVE_DATA_DIR: dir },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const timeout = setTimeout(
      () => reject(new Error("Startup timeout")),
      15000,
    );
    const output = (data) => {
      log += data;
      const t = log.match(/Pairing code: ([a-f0-9]+)/)?.[1];
      if (t) {
        clearTimeout(timeout);
        resolvePromise(t);
      }
    };
    server.stdout.on("data", output);
    server.stderr.on("data", output);
    server.on("error", reject);
  });
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const a = await desktop.newPage(),
    b = await mobile.newPage();
  for (const p of [a, b]) {
    await p.goto(`http://127.0.0.1:${port}`);
    await p.getByRole("button", { name: "打开偏好设置" }).click();
    await p.getByLabel("共享服务配对码").fill(token);
    await p.getByRole("button", { name: "连接并同步" }).click();
    await p.getByText("已与电脑共享服务同步", { exact: true }).waitFor();
  }
  await a.getByRole("button", { name: "素材书架", exact: true }).click();
  await a.getByLabel("新单词").fill("synchronise");
  await a.getByLabel("单词释义").fill("跨设备同步");
  await a.getByRole("button", { name: "收藏", exact: true }).click();
  const sync = async (p) => {
    await p.getByRole("button", { name: "打开偏好设置" }).click();
    await p.getByRole("button", { name: "连接并同步" }).click();
    await p.getByText("已与电脑共享服务同步", { exact: true }).waitFor();
  };
  await sync(a);
  await sync(b);
  await b.getByRole("button", { name: "温故知新", exact: true }).click();
  await b.getByRole("button", { name: "生词本 1" }).waitFor();
  await b.getByRole("heading", { name: "synchronise", exact: true }).waitFor();
  await b.getByRole("button", { name: "成长路径", exact: true }).click();
  await b
    .locator(".course-card")
    .first()
    .getByRole("button", { name: "语法微课" })
    .click();
  await b.getByRole("button", { name: "buys", exact: true }).click();
  await b.getByRole("button", { name: "检查答案", exact: true }).click();
  await b.getByRole("button", { name: "完成本节", exact: true }).click();
  await sync(b);
  await sync(a);
  const data = await a.evaluate(() =>
    JSON.parse(localStorage.getItem("grove-learning-v2")),
  );
  assert.equal(data.entries["done:morning:grammar"].value, true);
  await a.getByRole("button", { name: "温故知新", exact: true }).click();
  await a.getByRole("button", { name: "生词本 1" }).click();
  await a.getByRole("button", { name: "从本子移除", exact: true }).click();
  await sync(a);
  await sync(b);
  await b.getByRole("button", { name: "温故知新", exact: true }).click();
  await b.getByRole("button", { name: "生词本 0" }).waitFor();
  await mobile.setOffline(true);
  await b.getByRole("button", { name: "素材书架", exact: true }).click();
  await b.getByLabel("新单词").fill("offline");
  await b.getByLabel("单词释义").fill("离线仍可保存");
  await b.getByRole("button", { name: "收藏", exact: true }).click();
  await mobile.setOffline(false);
  await sync(b);
  await sync(a);
  await a.getByRole("button", { name: "温故知新", exact: true }).click();
  await a.getByRole("button", { name: "生词本 1" }).click();
  await a.getByRole("heading", { name: "offline", exact: true }).waitFor();
  console.log(
    `${ps ? "PowerShell" : "Node"} real-browser two-device sync: vocabulary, course completion, deletion and offline rejoin passed`,
  );
} finally {
  await browser?.close();
  if (server && server.exitCode === null)
    await new Promise((r) => {
      server.once("exit", r);
      server.kill();
    });
  rmSync(dir, { recursive: true, force: true });
}
