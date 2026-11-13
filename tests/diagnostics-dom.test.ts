import { afterEach, expect, it, vi } from "vitest";
import { inspectPage } from "../scripts/diagnostics.mjs";
afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  Reflect.deleteProperty(Range.prototype, "getBoundingClientRect");
});
function geometry() {
  const rect = (el: Element) => {
    const [x, y, width, height] = (el.getAttribute("data-rect") || "0,0,1,1")
      .split(",")
      .map(Number);
    return new DOMRect(x, y, width, height);
  };
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      return rect(this);
    },
  );
  vi.spyOn(Element.prototype, "getClientRects").mockImplementation(function (
    this: Element,
  ) {
    return [rect(this)] as unknown as DOMRectList;
  });
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: function (this: Range) {
      return rect(this.startContainer.parentElement!);
    },
  });
}
const page = { evaluate: async (fn: () => unknown) => fn() };
it("I-54 collects chrome bodies including icon-only controls and excludes their own labels", async () => {
  geometry();
  document.body.innerHTML =
    '<main data-presentation-root><button data-presentation-mode-toggle aria-label="icon-only" data-rect="0,0,100,40"><svg></svg></button><span data-rect="5,5,20,10">body collision</span><button data-presentation-attribution data-rect="200,0,100,40">own label</button></main>';
  const warnings = (await inspectPage(page, 2)).filter((s: string) =>
    s.includes("overlap"),
  );
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toContain("icon-only");
  expect(warnings[0]).toContain("body collision");
  expect(warnings[0]).toContain("step 2");
});
it("I-54 detects chrome against chrome while I-55 exemptions and hidden ancestors remain scoped", async () => {
  geometry();
  document.body.innerHTML =
    '<main data-presentation-root><div data-presentation-controls><button aria-label="first icon" data-rect="0,0,30,30"></button><button aria-label="second icon" data-rect="10,0,30,30"></button></div><div data-presentation-allow-overlap><button data-presentation-mode-toggle aria-label="allowed icon" data-rect="0,0,30,30"></button></div><div style="opacity:0"><button data-presentation-mode-toggle aria-label="hidden icon" data-rect="0,0,30,30"></button></div></main>';
  const warnings = (await inspectPage(page, 3)).filter((s: string) =>
    s.includes("overlap"),
  );
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toContain("first icon");
  expect(warnings[0]).toContain("second icon");
  expect(warnings.join()).not.toMatch(/allowed icon|hidden icon/);
});
