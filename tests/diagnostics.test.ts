import { it, expect } from "vitest";
// JS helpers are shared with browser tooling.
import { diagnose } from "../scripts/diagnostics.mjs";
import { validateReference } from "../scripts/verify.mjs";
const text = (key: string, x = 0, extra = {}) => ({
  key,
  x,
  y: 0,
  width: 20,
  height: 10,
  text: true,
  ...extra,
});
it("I-41 collision exemptions exclude hidden and explicitly allowed text", () => {
  expect(
    diagnose([text("a"), text("b", 5)], 3).find((w) => w.kind === "overlap"),
  ).toEqual({ step: 3, kind: "overlap", detail: "a overlaps b" });
  for (const extra of [{ allow: true }, { hidden: true }, { width: 0 }])
    expect(
      diagnose([text("a"), text("b", 5, extra)], 0).some(
        (w) => w.kind === "overlap",
      ),
    ).toBe(false);
  expect(
    diagnose([text("a"), text("b", 25)], 0).some((w) => w.kind === "overlap"),
  ).toBe(false);
});
it("I-42 active style comparisons identify indistinct progress and toc", () => {
  for (const group of ["toc", "progress"]) {
    const a = text("active", 0, {
        group,
        active: true,
        appearance: { color: "red" },
      }),
      b = text("inactive", 30, { group, appearance: { color: "red" } });
    expect(
      diagnose([a, b], 2).some((w) => w.kind === "active" && w.step === 2),
    ).toBe(true);
    b.appearance.color = "blue";
    expect(diagnose([a, b], 2).some((w) => w.kind === "active")).toBe(false);
  }
});
it("I-43 attribution missing small browser-default and polished variants", () => {
  for (const items of [
    [],
    [text("attr", 0, { attribution: true, fontSize: 8 })],
    [
      text("attr", 0, {
        attribution: true,
        fontSize: 16,
        browserDefault: true,
      }),
    ],
  ])
    expect(
      diagnose(items, 1).find((w) => w.kind === "attribution")?.detail,
    ).toContain("[data-presentation-attribution]");
  expect(
    diagnose(
      [
        text("attr", 0, {
          attribution: true,
          fontSize: 12,
          browserDefault: false,
        }),
      ],
      1,
    ),
  ).toEqual([]);
});
it("reference validation rejects missing malformed and duplicate identities", () => {
  for (const bad of [
    undefined,
    {},
    { steps: [] },
    {
      steps: Array(9).fill({
        id: "duplicate",
        era: "x",
        title: "x",
        caption: "x",
      }),
    },
  ])
    expect(() => validateReference(bad)).toThrow("sample");
});
