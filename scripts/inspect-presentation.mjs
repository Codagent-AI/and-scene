import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { withPreview } from "./browser-runtime.mjs";
import { inspectPage } from "./diagnostics.mjs";
import { parseOptions, validateCount } from "./verification-core.mjs";
const options = parseOptions(process.argv.slice(2));
try {
  if (!/^[a-z0-9-]+$/.test(options.slug))
    throw new Error("Expected a registered presentation slug");
  if (
    ![options.width, options.height, options.settle].every(Number.isFinite) ||
    options.width < 200 ||
    options.height < 200 ||
    options.settle < 0
  )
    throw new Error("Invalid viewport or settle interval");
  const out = resolve(
    "artifacts/inspection",
    options.slug,
    `${options.width}x${options.height}`,
  );
  await mkdir(out, { recursive: true });
  const report = [];
  await withPreview(async (page, url) => {
    await page.goto(`${url}/${options.slug}`);
    const root = page.locator("[data-step-count]");
    await root.waitFor({ timeout: 10000 });
    const count = validateCount(
      Number(await root.getAttribute("data-step-count")),
    );
    for (let i = 0; i < count; i++) {
      if (i) await page.keyboard.press("ArrowRight");
      await page.waitForFunction(
        (index) =>
          document
            .querySelector("[data-step-index]")
            ?.getAttribute("data-step-index") === String(index),
        i,
      );
      const started = Date.now();
      await page.waitForTimeout(options.settle);
      const warnings = await inspectPage(page, i);
      const file = resolve(out, `step-${String(i + 1).padStart(2, "0")}.png`);
      await page.screenshot({ path: file });
      report.push({ step: i, file, waitedMs: Date.now() - started, warnings });
      console.log(`capture step ${i}: ${file}`);
      for (const warning of warnings) console.warn(`ADVISORY: ${warning}`);
    }
  }, options);
  await writeFile(
    resolve(out, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    "Inspection artifacts saved; visual warnings are advisory, not pass/fail evidence.",
  );
} catch (error) {
  console.error(`Inspection failed: ${error.message}`);
  process.exitCode = 1;
}
