import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { chromium } from "playwright";
export const HOST = "127.0.0.1";
export const browserFailure = (kind, step, message) =>
  new Error(`render: step ${step}: ${kind}: ${message}`);
export async function command(cmd, args, cwd = process.cwd()) {
  await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`)),
    );
  });
}
async function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, HOST, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}
export async function withBrowser(
  run,
  { cwd = process.cwd(), viewport = { width: 1440, height: 900 } } = {},
) {
  const port = await freePort(),
    url = `http://${HOST}:${port}`;
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
  let output = "",
    startupError;
  child.stdout.on("data", (data) => {
    output += data;
  });
  child.stderr.on("data", (data) => {
    output += data;
  });
  child.on("error", (e) => {
    startupError = e;
  });
  let browser;
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (startupError) throw startupError;
      if (child.exitCode !== null) throw new Error(`preview: ${output}`);
      try {
        const response = await fetch(url);
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {
        /* starting */
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!ready)
      throw new Error(`preview: readiness timeout at ${url}: ${output}`);
    console.log(`preview: ready ${url}`);
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage({ viewport });
    return await run(page, url);
  } finally {
    if (browser) await browser.close();
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise((resolve) => child.once("exit", resolve));
      child.kill("SIGTERM");
      const killer = setTimeout(() => child.kill("SIGKILL"), 2000);
      await exited;
      clearTimeout(killer);
    }
    console.log("preview: cleaned up");
  }
}
export function monitorErrors(page, getStep) {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error")
      errors.push(browserFailure("console", getStep(), m.text()));
  });
  page.on("pageerror", (e) =>
    errors.push(browserFailure("page", getStep(), e.message)),
  );
  return () => {
    if (errors.length) throw errors[0];
  };
}
export async function visitSteps(
  page,
  url,
  slug,
  { onStep = async () => {}, settle = 850, checkCanonical } = {},
) {
  let index = 0;
  const checkErrors = monitorErrors(page, () => index);
  await page.goto(`${url}/${slug}`);
  const host = page.locator("[data-step-count]");
  try {
    await host.waitFor({ timeout: 8000 });
  } catch {
    checkErrors();
    throw new Error(`sample: no presentation hooks at /${slug}`);
  }
  const count = Number(await host.getAttribute("data-step-count"));
  if (!Number.isInteger(count) || count < 1)
    throw new Error("sample: invalid step count");
  const metadata = [];
  for (index = 0; index < count; index++) {
    try {
      await page.waitForFunction(
        (i) =>
          document
            .querySelector("[data-step-index]")
            ?.getAttribute("data-step-index") === String(i),
        index,
        { timeout: 3000 },
      );
    } catch {
      checkErrors();
      throw browserFailure("transition", index, "step index did not advance");
    }
    await page.waitForTimeout(settle);
    checkErrors();
    metadata.push(
      await page.evaluate(() => ({
        title: document.querySelector("[data-presentation-step-title]")
          ?.textContent,
        caption: document.querySelector("[data-presentation-caption]")
          ?.textContent,
        era: document
          .querySelector("[data-presentation-marker]")
          ?.textContent?.split(" · ")[1],
      })),
    );
    await onStep(index);
    console.log(`render: step ${index} passed`);
    if (index < count - 1) await page.keyboard.press("ArrowRight");
  }
  checkErrors();
  if (checkCanonical) checkCanonical(metadata);
  return count;
}
