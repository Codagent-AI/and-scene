import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { command, withPreview, visitSteps, SETTLE_MS } from "./browser.mjs";
import { collectElements, diagnose } from "./diagnostics.mjs";
export async function inspect({
  slug,
  build = true,
  settle = SETTLE_MS,
  viewport,
} = {}) {
  if (!slug || !/^[a-z0-9-]+$/.test(slug))
    throw new Error("Expected a registered presentation slug");
  if (build) await command("npm", ["run", "build"]);
  const dir = resolve("artifacts/inspection", slug);
  await mkdir(dir, { recursive: true });
  const report = [];
  await withPreview((browser, url) =>
    visitSteps(browser, url, slug, {
      settle,
      viewport,
      onStep: async (page, index) => {
        const warnings = diagnose(await collectElements(page), index);
        warnings.forEach((w) =>
          console.warn(`ADVISORY step ${index} ${w.kind}: ${w.detail}`),
        );
        const file = `step-${String(index + 1).padStart(2, "0")}.png`;
        await page.screenshot({ path: join(dir, file) });
        report.push({ step: index, file, settle, warnings });
      },
    }),
  );
  await writeFile(
    join(dir, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    `Captured ${report.length} settled steps in ${dir}; warnings are advisory`,
  );
  return report;
}
if (import.meta.url === pathToFileURL(process.argv[1]).href)
  inspect({ slug: process.argv[2] }).catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
