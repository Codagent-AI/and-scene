import { expect, it } from "vitest";
import { validateSample, canonical } from "../scripts/sample-contract.mjs";
import { diagnostics } from "../scripts/diagnostics.mjs";
it("I-36 console and page errors identify the step", async () => {
  const { browserFailure } = await import("../scripts/browser.mjs");
  expect(browserFailure("console", 3, "bad").message).toContain(
    "render: step 3",
  );
  expect(browserFailure("page", 5, "bad").message).toContain("step 5");
});
it("I-39 overlap visible filtering and subtree exemptions", () => {
  const box = { x: 0, y: 0, w: 20, h: 20 };
  const text = (name: string, allowed = false) => ({
    name,
    rect: box,
    allowed,
  });
  expect(
    diagnostics(
      {
        texts: [text("a"), text("b")],
        active: [],
        attribution: { size: 12, styled: true },
      },
      2,
    ).join(),
  ).toContain("step 2 overlap");
  expect(
    diagnostics(
      {
        texts: [text("a", true), text("b", true)],
        active: [],
        attribution: { size: 12, styled: true },
      },
      2,
    ),
  ).toEqual([]);
});
it("I-40 active controls and attribution diagnostic variants", () => {
  const base = {
    texts: [],
    active: [
      { kind: "progress", distinct: false },
      { kind: "toc", distinct: false },
    ],
  };
  for (const attribution of [
    null,
    { size: 9, styled: true },
    { size: 16, styled: false },
  ]) {
    const warnings = diagnostics({ ...base, attribution }, 4).join();
    expect(warnings).toContain("progress");
    expect(warnings).toContain("toc");
    expect(warnings).toContain("data-presentation-attribution");
  }
  expect(
    diagnostics(
      {
        texts: [],
        active: [{ kind: "toc", distinct: true }],
        attribution: { size: 12, styled: true },
      },
      0,
    ),
  ).toEqual([]);
});
it("I-29 malformed metadata error names phase", () => {
  expect(() => validateSample(null)).toThrow("sample:");
  expect(() =>
    validateSample(
      canonical.map((s, i) => (i === 3 ? { ...s, caption: "wrong" } : s)),
    ),
  ).toThrow("step 3");
});
