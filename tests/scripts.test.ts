// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  validateOutline,
  failureMessage,
  parseOptions,
  validateCount,
  SETTLE_MS,
} from "../scripts/verification-core.mjs";
import {
  overlapWarnings,
  chromeWarnings,
  attributionWarnings,
} from "../scripts/diagnostics.mjs";
import outline from "../scripts/reference-outline.json";
describe("verification validation", () => {
  it("rejects absent, malformed and reordered reference metadata", () => {
    expect(() => validateOutline(null)).toThrow();
    expect(() => validateOutline(outline.slice(1))).toThrow();
    expect(() => validateOutline([...outline].reverse())).toThrow();
    expect(() => validateOutline(outline)).not.toThrow();
  });
  it("labels browser errors with phase and current step", () => {
    expect(failureMessage("console", 3, "broken")).toContain("step 3");
    expect(failureMessage("pageerror", 4, "broken")).toContain("pageerror");
  });
});
describe("visual diagnostic logic", () => {
  const a = {
    name: "a",
    x: 0,
    y: 0,
    width: 50,
    height: 20,
    visible: true,
    allow: false,
  };
  it("reports unmarked collisions but excludes hidden separate and allowed subtrees", () => {
    expect(overlapWarnings([a, { ...a, name: "b", x: 10 }], 2)).toHaveLength(1);
    expect(overlapWarnings([a, { ...a, name: "b", x: 90 }], 2)).toHaveLength(0);
    expect(
      overlapWarnings([a, { ...a, name: "b", visible: false }], 2),
    ).toHaveLength(0);
    expect(
      overlapWarnings(
        [
          { ...a, allow: true },
          { ...a, name: "b" },
        ],
        2,
      ),
    ).toHaveLength(0);
  });
  it("reports indistinct progress and toc states", () => {
    for (const kind of ["progress", "toc"]) {
      expect(
        chromeWarnings(
          [
            { kind, active: true, signature: "same" },
            { kind, active: false, signature: "same" },
          ],
          3,
        ),
      ).toHaveLength(1);
      expect(
        chromeWarnings(
          [
            { kind, active: true, signature: "different" },
            { kind, active: false, signature: "same" },
          ],
          3,
        ),
      ).toHaveLength(0);
    }
  });
  it("reports absent default or small attribution and accepts local styling", () => {
    expect(attributionWarnings(null, 0)).toHaveLength(1);
    expect(
      attributionWarnings(
        {
          fontSize: 16,
          color: "rgb(0, 0, 238)",
          fontFamily: "Times New Roman",
          decoration: "underline",
        },
        0,
      ),
    ).toHaveLength(1);
    expect(
      attributionWarnings(
        {
          fontSize: 8,
          color: "rgb(30, 50, 40)",
          fontFamily: "Arial",
          decoration: "none",
        },
        0,
      ),
    ).toHaveLength(1);
    expect(
      attributionWarnings(
        {
          fontSize: 12,
          color: "rgb(30, 50, 40)",
          fontFamily: "Arial",
          decoration: "none",
        },
        0,
      ),
    ).toHaveLength(0);
  });
});

it("I-53 settle configuration includes layout and entrant duration and accepts explicit interval", () => {
  expect(SETTLE_MS).toBeGreaterThanOrEqual(700);
  expect(parseOptions(["fixture", "--settle", "950"]).settle).toBe(950);
  expect(parseOptions(["fixture"]).settle).toBe(880);
});
it("invalid public step counts fail rather than reporting success", () => {
  for (const count of [0, -1, NaN, 1.5])
    expect(() => validateCount(count)).toThrow("invalid step count");
  expect(validateCount(9)).toBe(9);
});
it('presentation CLI accepts positional or named slug and keeps default for option-only calls',()=>{
 expect(parseOptions([]).slug).toBe('how-to-make-a-presentation')
 expect(parseOptions(['example']).slug).toBe('example')
 expect(parseOptions(['--presentation','named']).slug).toBe('named')
 expect(parseOptions(['--width','390']).slug).toBe('how-to-make-a-presentation')
})
