import { afterEach, expect, it, vi } from "vitest";
import { inspectPage } from "../scripts/diagnostics.mjs";
afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  Reflect.deleteProperty(Range.prototype, "getBoundingClientRect");
});
function geometry() {
  const rect = (el: Element, override?: string) => {
    const [x, y, width, height] = (
      override ||
      el.getAttribute("data-rect") ||
      "0,0,1,1"
    )
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
      const node = this.startContainer;
      const el = node instanceof Element ? node : node.parentElement!;
      const content = el.getAttribute("data-content-rect");
      return content ? rect(el, content) : rect(el);
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
it("measures plain text chrome by its text extent, not its full-width block", async () => {
  geometry();
  document.body.innerHTML =
    '<main data-presentation-root><header><div data-presentation-title data-rect="0,0,1000,30" data-content-rect="0,0,200,30">Title</div><button data-presentation-mode-toggle aria-label="Switch" data-rect="900,0,80,30">Present</button></header></main>';
  const warnings = (await inspectPage(page, 1)).filter((s: string) =>
    s.includes("overlap"),
  );
  expect(warnings).toEqual([]);
});
it("still reports painted or control chrome that collides by its box", async () => {
  geometry();
  document.body.innerHTML =
    '<main data-presentation-root><div data-presentation-caption style="background:#fff" data-rect="0,0,1000,30" data-content-rect="0,0,200,30">Caption</div><button data-presentation-mode-toggle aria-label="Switch" data-rect="900,0,80,30"></button></main>';
  const warnings = (await inspectPage(page, 1)).filter((s: string) =>
    s.includes("overlap"),
  );
  expect(warnings.some((w: string) => w.includes("Switch"))).toBe(true);
});
