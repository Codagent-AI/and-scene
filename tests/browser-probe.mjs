// Test-only instrumentation loaded into the CLI process, never the shipped app.
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { appendFileSync } from "node:fs";
import { chromium } from "playwright";
const resourceLog = process.env.AND_SCENE_RESOURCE_LOG;
const captureLog = process.env.AND_SCENE_CAPTURE_LOG;
const save = (file, item) => {
  if (file) appendFileSync(file, JSON.stringify(item) + "\n");
};
const spawn = childProcess.spawn;
childProcess.spawn = function (command, args, options) {
  const child = spawn.call(this, command, args, options);
  if (
    Array.isArray(args) &&
    args.some((arg) => String(arg).endsWith("vite/bin/vite.js")) &&
    args.includes("preview")
  )
    save(resourceLog, { kind: "preview", pid: child.pid });
  return child;
};
syncBuiltinESMExports();
const launch = chromium.launch.bind(chromium);
chromium.launch = async (options) => {
  const browser = await launch(options);
  if (resourceLog) {
    const session = await browser.newBrowserCDPSession();
    const { processInfo } = await session.send("SystemInfo.getProcessInfo");
    const process = processInfo.find((item) => item.type === "browser");
    if (!process)
      throw new Error("Resource probe could not observe Chromium process");
    save(resourceLog, { kind: "browser", pid: process.id });
    await session.detach();
  }
  if (captureLog) {
    const newPage = browser.newPage.bind(browser);
    browser.newPage = async (options) => {
      const page = await newPage(options);
      await page.addInitScript(() => {
        window.__stepObservation = null;
        new MutationObserver(() => {
          const root = document.querySelector("[data-step-index]");
          const index = root?.getAttribute("data-step-index");
          if (root && index !== window.__stepObservation?.index)
            window.__stepObservation = { index, at: performance.now() };
        }).observe(document, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ["data-step-index"],
        });
      });
      const screenshot = page.screenshot.bind(page);
      page.screenshot = async (options) => {
        // Observe BEFORE invoking the real screenshot, independent of helper reports.
        const state = await page.evaluate(() => {
          const target = document.querySelector(".settled");
          const style = getComputedStyle(target);
          return {
            step: Number(
              document
                .querySelector("[data-step-index]")
                .getAttribute("data-step-index"),
            ),
            beat: Number(target.dataset.beat),
            elapsedMs: performance.now() - window.__stepObservation.at,
            opacity: Number(style.opacity),
            transform: style.transform,
            running: target
              .getAnimations()
              .some((a) => a.playState === "running"),
          };
        });
        save(captureLog, state);
        return screenshot(options);
      };
      return page;
    };
  }
  return browser;
};
