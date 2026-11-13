import { afterEach, expect, it, vi } from "vitest";
import { collectDiagnostics, diagnostics } from "../scripts/diagnostics.mjs";
afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
  document.head.querySelectorAll("style").forEach((el) => el.remove());
});
function fixture(html: string, css = "") {
  document.body.innerHTML = html;
  const style = document.createElement("style");
  style.textContent = "*{opacity:1}" + css;
  document.head.append(style);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      return DOMRect.fromRect({
        x: Number(this.dataset.x ?? 0),
        y: 0,
        width: 40,
        height: 30,
      });
    },
  );
  vi.spyOn(document, "createRange").mockImplementation(
    () =>
      ({
        selectNodeContents: () => {},
        getClientRects: () => [],
      }) as unknown as Range,
  );
}
it("I-39 chrome bounds catch empty icon and progress controls without warning on their nesting", () => {
  fixture(
    '<main data-presentation><div data-presentation-controls><button aria-label="icon" data-x="10"></button><button aria-label="dot" data-x="30"></button></div></main>',
  );
  const warnings = diagnostics(collectDiagnostics(), 2);
  expect(warnings.join()).toContain("chrome: icon / chrome: dot");
  expect(warnings.join()).not.toContain("controls /");
});
it("I-40 attribution accepts shared host anchor styles against an isolated browser baseline", () => {
  fixture(
    '<main data-presentation><a data-presentation-attribution href="https://example.com">made by and-scene</a></main>',
    "a{color:rgb(12,34,56);font-family:monospace;font-size:12px;text-decoration:none}",
  );
  expect(collectDiagnostics().attribution).toEqual({ size: 12, styled: true });
  expect(diagnostics(collectDiagnostics(), 0).join()).not.toContain(
    "attribution:",
  );
});
