import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { withBrowser, visitSteps } from "./browser.mjs";
import { collectDiagnostics, diagnostics } from "./diagnostics.mjs";
const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("Usage: npm run inspect -- <registered-slug>");
  process.exitCode = 1;
} else {
  const dir = resolve("artifacts/inspection", slug);
  const settle = Number(process.env.PRESENTATION_SETTLE_MS ?? 850);
  try {
    if (!Number.isFinite(settle) || settle < 0)
      throw new Error("Invalid settle interval");
    await mkdir(dir, { recursive: true });
    const records = [];
    await withBrowser(async (page, url) =>
      visitSteps(page, url, slug, {
        settle,
        onStep: async (index) => {
          const warnings = diagnostics(
            await page.evaluate(collectDiagnostics),
            index,
          );
          warnings.forEach((w) => console.warn(`ADVISORY ${w}`));
          const filename = `step-${String(index + 1).padStart(2, "0")}.png`;
          await page.screenshot({ path: resolve(dir, filename) });
          records.push({
            index,
            filename,
            settleMs: settle,
            capturedAt: Date.now(),
            warnings,
          });
        },
      }),
    );
    await writeFile(
      resolve(dir, "report.json"),
      JSON.stringify(records, null, 2) + "\n",
    );
    console.log(
      `Captured ${records.length} settled screenshots in ${dir}; warnings are advisory.`,
    );
  } catch (error) {
    console.error(`FAIL inspection: ${error.message}`);
    process.exitCode = 1;
  }
}
