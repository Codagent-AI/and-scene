import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { chromium } from "playwright";
export const HOST = "127.0.0.1";
export const SETTLE_MS = 800;
export async function command(command, args, cwd = process.cwd()) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });
}
export async function withPreview(run, { cwd = process.cwd() } = {}) {
  const port = await new Promise((resolve, reject) => {
    const s = createServer();
    s.on("error", reject);
    s.listen(0, HOST, () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
  const child = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      HOST,
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd, stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  const url = `http://${HOST}:${port}`;
  let browser;
  try {
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(`preview exited: ${output}`);
      try {
        const r = await fetch(url);
        if (r.ok) break;
      } catch {
        /* readiness retry */
      }
      if (i === 99) throw new Error(`preview readiness failed: ${output}`);
      await new Promise((r) => setTimeout(r, 100));
    }
    console.log(`Preview ${url}`);
    browser = await chromium.launch({ headless: true });
    return await run(browser, url);
  } finally {
    await browser?.close();
    if (child.exitCode === null) {
      const exited = new Promise((r) => child.once("exit", r));
      child.kill("SIGTERM");
      await exited;
    }
    console.log("Preview cleaned up");
  }
}
export async function visitSteps(
  browser,
  url,
  slug,
  {
    onStep = async () => {},
    expected,
    firstOnly = false,
    viewport = { width: 1440, height: 1000 },
    settle = SETTLE_MS,
  } = {},
) {
  const page = await browser.newPage({ viewport });
  let index = 0;
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  try {
    await page.goto(`${url}/${slug}`);
    const root = page.locator("[data-presentation-root]");
    await root.waitFor({ timeout: 10000 });
    const count = Number(await root.getAttribute("data-step-count"));
    if (!Number.isInteger(count) || count < 1)
      throw new Error("invalid step count");
    if (expected && count !== expected.steps.length)
      throw new Error(
        `sample count ${count}, expected ${expected.steps.length}`,
      );
    for (index = 0; index < (firstOnly ? 1 : count); index++) {
      try {
        await page.waitForFunction(
          (i) =>
            document
              .querySelector("[data-presentation-root]")
              ?.getAttribute("data-step-index") === String(i),
          index,
          { timeout: 3000 },
        );
      } catch {
        throw new Error("transition did not advance");
      }
      await page.waitForTimeout(settle);
      if (errors.length) throw new Error(errors.join("; "));
      if (expected) {
        if (
          (await page.locator("[data-presentation-title]").textContent()) !==
          expected.steps[index].title
        )
          throw new Error("sample title mismatch");
        if (
          (await page.locator("[data-presentation-caption]").textContent()) !==
          expected.steps[index].caption
        )
          throw new Error("sample caption mismatch");
        if (
          !(
            await page.locator("[data-presentation-marker]").textContent()
          ).includes(expected.steps[index].era)
        )
          throw new Error("sample era mismatch");
      }
      await onStep(page, index, count);
      console.log(`step ${index} rendered`);
      if (index < count - 1 && !firstOnly)
        await page.keyboard.press("ArrowRight");
    }
  } catch (error) {
    throw new Error(`render step ${index}: ${error.message}`, { cause: error });
  } finally {
    await page.close();
  }
}
