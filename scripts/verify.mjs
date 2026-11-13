import { command, withPreview } from "./browser-runtime.mjs";
import {
  REFERENCE_SLUG,
  reference,
  validateOutline,
  validateCount,
  failureMessage,
  parseOptions,
  SETTLE_MS,
} from "./verification-core.mjs";
import { readFile } from "node:fs/promises";
const { slug } = parseOptions(process.argv.slice(2));
let phase = "build";
try {
  await command("npm", ["run", "build"]);
  phase = "sample";
  if (slug === REFERENCE_SLUG)
    validateOutline(
      JSON.parse(
        await readFile(
          `src/presentations/${REFERENCE_SLUG}/outline.json`,
          "utf8",
        ),
      ),
    );
  phase = "render";
  await withPreview(async (page, url) => {
    let index = 0;
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error")
        errors.push(failureMessage("console", index, msg.text()));
    });
    page.on("pageerror", (err) =>
      errors.push(failureMessage("pageerror", index, err.message)),
    );
    await page.goto(`${url}/${slug}`);
    const root = page.locator("[data-step-count]");
    try {
      await root.waitFor({ timeout: 10000 });
    } catch {
      throw new Error(
        errors.join("\n") ||
          failureMessage("render", 0, "presentation root did not render"),
      );
    }
    const count = validateCount(
      Number(await root.getAttribute("data-step-count")),
    );
    if (slug === REFERENCE_SLUG && count !== 9)
      throw new Error("sample: expected nine rendered steps");
    for (index = 0; index < count; index++) {
      if (index > 0) await page.keyboard.press("ArrowRight");
      try {
        await page.waitForFunction(
          (i) =>
            document
              .querySelector("[data-step-index]")
              ?.getAttribute("data-step-index") === String(i),
          index,
          { timeout: 3500 },
        );
      } catch {
        throw new Error(
          failureMessage("transition", index, "step index failed to advance"),
        );
      }
      await page.waitForTimeout(SETTLE_MS);
      if (errors.length) throw new Error(errors.join("\n"));
      if (slug === REFERENCE_SLUG) {
        const actual = await root
          .locator("[data-presentation-title]")
          .innerText();
        const caption = await root
          .locator("[data-presentation-caption]")
          .innerText();
        if (
          actual !== reference[index].title ||
          caption !== reference[index].caption
        )
          throw new Error(
            failureMessage(
              "sample",
              index,
              "rendered title/caption differs from normative outline",
            ),
          );
      }
      console.log(`render: step ${index} / ${count - 1} clean`);
    }
  });
  console.log("PASS: build, sample and render verification");
} catch (error) {
  console.error(`FAIL [${phase}]: ${error.message}`);
  process.exitCode = 1;
}
