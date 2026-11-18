import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { requireRegistration } from "./registry.mjs";
import { command, withPreview, visitSteps } from "./browser.mjs";
export function validateReference(expected) {
  if (
    !expected ||
    expected.steps?.length !== 9 ||
    new Set(expected.steps.map((s) => s.id)).size !== 9 ||
    expected.steps.some((s) => !s.title || !s.caption || !s.era)
  )
    throw new Error("sample: malformed reference outline");
}
export async function verify({
  slug = "how-to-make-a-presentation",
  build = true,
  reference = true,
  firstOnly = false,
} = {}) {
  let phase = "sample";
  try {
    await requireRegistration(slug);
    const expected = reference
      ? JSON.parse(
          await readFile(new URL("./reference.json", import.meta.url), "utf8"),
        )
      : undefined;
    if (expected) validateReference(expected);
    phase = "build";
    if (build) await command("npm", ["run", "build"]);
    phase = "render";
    await withPreview((browser, url) =>
      visitSteps(browser, url, slug, { expected, firstOnly }),
    );
    console.log("PASS build / sample / render");
  } catch (error) {
    throw new Error(`FAIL ${phase}: ${error.message}`, { cause: error });
  }
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const slug = process.argv.find((a) => a.startsWith("--slug="))?.slice(7);
  verify({
    slug,
    reference: !slug,
    firstOnly: process.argv.includes("--first-only"),
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
