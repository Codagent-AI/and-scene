import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { chromium } from "playwright";
export function command(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `${command} ${args.join(" ")} failed (${signal || code})`,
            ),
          ),
    );
  });
}
async function port() {
  const server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const n = server.address().port;
  await new Promise((r) => server.close(r));
  return n;
}
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
export async function withPreview(
  run,
  { cwd = process.cwd(), width = 1440, height = 900 } = {},
) {
  const url = `http://127.0.0.1:${await port()}`;
  const child = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      new URL(url).port,
      "--strictPort",
    ],
    { cwd, stdio: ["ignore", "pipe", "pipe"], detached: true },
  );
  let startup = "";
  let exit;
  child.stdout.on("data", (b) => (startup += b));
  child.stderr.on("data", (b) => (startup += b));
  child.on("error", (e) => (exit = e.message));
  child.on("exit", (code) => (exit = `exit ${code}`));
  let browser;
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (exit) throw new Error(`preview: ${exit} ${startup}`);
      try {
        const r = await fetch(url);
        if (r.ok) {
          ready = true;
          break;
        }
      } catch {}
      await delay(100);
    }
    if (!ready) throw new Error(`preview readiness failed: ${url} ${startup}`);
    console.log(`preview: ${url} (host, readiness and browser use 127.0.0.1)`);
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage({ viewport: { width, height } });
    return await run(page, url);
  } finally {
    try {
      await browser?.close();
    } finally {
      if (child.exitCode === null) {
        const stopped = new Promise((resolve) => child.once("exit", resolve));
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch {}
        await Promise.race([stopped, delay(2000)]);
        if (child.exitCode === null) {
          try {
            process.kill(-child.pid, "SIGKILL");
          } catch {}
        }
      }
    }
  }
}
