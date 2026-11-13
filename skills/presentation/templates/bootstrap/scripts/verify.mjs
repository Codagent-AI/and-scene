import { command, withBrowser, visitSteps } from "./browser.mjs";
import { validateSample } from "./sample-contract.mjs";
let phase = "build";
try {
  await command("npm", ["run", "build"]);
  phase = "render";
  await withBrowser(async (page, url) => {
    await visitSteps(page, url, "how-to-make-a-presentation", {
      checkCanonical: validateSample,
    });
  });
  console.log(
    "PASS: whole application build, sample outline, and every step render",
  );
} catch (error) {
  console.error(`FAIL ${phase}: ${error.message}`);
  process.exitCode = 1;
}
