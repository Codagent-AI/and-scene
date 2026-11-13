import { expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import {
  STATES,
  STEPS,
  SampleScene,
} from "../src/presentations/how-to-make-a-presentation/steps";
import outline from "../scripts/reference-outline.json";
afterEach(cleanup);
it("I-37 canonical reference metadata matches all normative fields", () => {
  expect(
    STEPS.map(({ id, era, title, caption }) => ({ id, era, title, caption })),
  ).toEqual(outline);
});
it("I-38 opening has you and prompt", () => {
  expect(STATES[0].entities.map((e) => e.id)).toEqual(["you", "prompt"]);
});
it("I-39 interview adds skill arrow and question above conversation", () => {
  const es = STATES[1].entities;
  expect(es.find((e) => e.id === "conversation")?.text).toContain("←");
  expect(es.find((e) => e.id === "conversation")?.text).toContain("→");
  expect(es.find((e) => e.id === "question")!.y).toBeLessThan(
    es.find((e) => e.id === "conversation")!.y,
  );
  expect(es.some((e) => e.id === "skill")).toBe(true);
});
it("I-40 first card contains title caption visual and morphs belong on links", () => {
  const card = STATES[2].entities.find((e) => e.id === "card-1")!;
  expect(card.text).toMatch(/title.*caption[\s\S]*visual/);
  expect(card.text).not.toContain("morph");
  expect(STATES[2].entities.some((e) => e.id === "tray")).toBe(true);
  for (const e of STATES[3].entities.filter((e) => e.id.startsWith("morph")))
    expect(e.kind).toBe("arrow");
});
it("I-41 more cards grow without moving existing entities", () => {
  expect(
    STATES[3].entities.filter((e) => e.id.startsWith("card-")),
  ).toHaveLength(3);
  for (const e of STATES[2].entities)
    expect(STATES[3].entities.find((n) => n.id === e.id)).toEqual(e);
});
it("I-42 ghost and depth control preserve intended docking", () => {
  const es = STATES[4].entities;
  expect(es.find((e) => e.id === "ghost")?.tone).toBe("ghost");
  expect(es.find((e) => e.id === "depth")?.text).toBe("partial ↔ full");
  expect(es.find((e) => e.id === "depth")?.x).toBe(
    es.find((e) => e.id === "you")?.x,
  );
});
it("I-43 kit socket names shared kit below unframed tray", () => {
  const es = STATES[5].entities;
  expect(es.find((e) => e.id === "kit")?.text).toContain("shared scene kit");
  expect(es.find((e) => e.id === "kit")?.y).toBeGreaterThan(
    es.find((e) => e.id === "card-1")!.y +
      es.find((e) => e.id === "card-1")!.h!,
  );
  expect(es.some((e) => e.kind === "frame")).toBe(false);
  const edge = es.find((e) => e.id === "tray-edge")!;
  expect(edge, "a rendered, unframed bottom edge must exist").toBeTruthy();
  const plug = es.find((e) => e.id === "kit-plug")!;
  const socket = es.find((e) => e.id === "kit")!;
  expect(plug.y).toBe(edge.y + edge.h!);
  expect(plug.y + plug.h!).toBe(socket.y);
  expect(plug.x).toBeGreaterThanOrEqual(edge.x);
  expect(plug.x + plug.w).toBeLessThanOrEqual(edge.x + edge.w);
  expect(plug.x).toBeGreaterThanOrEqual(socket.x);
  expect(plug.x + plug.w).toBeLessThanOrEqual(socket.x + socket.w);
  const { container } = render(<SampleScene payload={STATES[5]} />);
  expect(
    container
      .querySelector('[data-presentation-entity="how-to-make:tray-edge"]')
      ?.classList.contains("tray-edge"),
  ).toBe(true);
  expect(
    container
      .querySelector('[data-presentation-entity="how-to-make:kit-plug"]')
      ?.classList.contains("plug"),
  ).toBe(true);
  for (const old of STATES[4].entities)
    expect(es.find((e) => e.id === old.id)).toBe(old);
});
it("I-44 verification follows cards in the same row with build/render pass", () => {
  const es = STATES[6].entities;
  const verify = es.find((e) => e.id === "verify")!;
  expect(verify.y).toBe(es.find((e) => e.id === "card-3")?.y);
  expect(verify.x).toBeGreaterThan(es.find((e) => e.id === "card-3")!.x);
  expect(verify.text).toMatch(/✓ verify[\s\S]*build \+ render[\s\S]*PASS/);
  expect(verify.tone).toBe("pass");
});
it("I-45 modification arc and card flag are added without replacing card", () => {
  const es = STATES[7].entities;
  expect(es.find((e) => e.id === "modify")?.text).toContain("modify");
  expect(
    es.find((e) => e.id === "modify")!.y +
      es.find((e) => e.id === "modify")!.h!,
  ).toBeGreaterThanOrEqual(es.find((e) => e.id === "edited")!.y);
  expect(es.find((e) => e.id === "edited")?.text).toBe("edited");
  expect(es.find((e) => e.id === "card-2")).toBe(
    STATES[6].entities.find((e) => e.id === "card-2"),
  );
});
it("I-46 final frame encloses diagram and labels the reveal", () => {
  const es = STATES[8].entities;
  const frame = es.find((e) => e.id === "reveal")!;
  expect(frame.kind).toBe("frame");
  expect(frame.text).toContain("you’re looking at one");
  for (const e of es.filter((e) => e !== frame)) {
    expect(e.x).toBeGreaterThan(frame.x);
    expect(e.y).toBeGreaterThan(frame.y);
    expect(e.x + e.w).toBeLessThan(frame.x + frame.w);
    expect(e.y + (e.h || 0)).toBeLessThan(frame.y + frame.h!);
  }
});
it("I-47 sample accumulates nine fixed-coordinate states in one scene", () => {
  expect(STEPS).toHaveLength(9);
  expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1);
  expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1);
  for (let i = 1; i < STATES.length; i++)
    for (const old of STATES[i - 1].entities) {
      const current = STATES[i].entities.find((e) => e.id === old.id);
      expect(current).toBeTruthy();
      expect([current!.x, current!.y]).toEqual([old.x, old.y]);
    }
  const { rerender } = render(<SampleScene payload={STATES[0]} />);
  const you = document.querySelector(
    '[data-presentation-entity="how-to-make:you"]',
  );
  rerender(<SampleScene payload={STATES[8]} />);
  expect(
    document.querySelector('[data-presentation-entity="how-to-make:you"]'),
  ).toBe(you);
});
