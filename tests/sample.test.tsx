import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { STEPS } from "../src/presentations/how-to-make-a-presentation/steps";
import {
  visibleEntities,
  entities,
} from "../src/presentations/how-to-make-a-presentation/entities";
import { Scene } from "../src/presentations/how-to-make-a-presentation/steps/Scene";
import { findPresentation, presentations } from "../src/presentations";
import Landing from "../src/Landing";
import reference from "../scripts/reference.json";
it("I-24 explicit registry and landing preserve route discovery and unknown fallback", () => {
  expect(findPresentation("/how-to-make-a-presentation")).toBe(
    presentations[0],
  );
  expect(findPresentation("/unknown")).toBeUndefined();
  expect(findPresentation("/")).toBeUndefined();
  expect(findPresentation("/how-to-make-a-presentation/")).toBe(
    presentations[0],
  );
  render(<Landing />);
  expect(screen.getByRole("link").getAttribute("href")).toBe(
    "/how-to-make-a-presentation",
  );
});
it("I-32 sample metadata matches every normative row in order", () => {
  expect(
    STEPS.map(({ id, era, title, caption }) => ({ id, era, title, caption })),
  ).toEqual(reference.steps);
  expect(STEPS).toHaveLength(9);
  expect(presentations[0].title).toBe(reference.title);
});
it("I-33 cumulative entities stay fixed across every sample state", () => {
  for (let beat = 1; beat <= 9; beat++) {
    const now = visibleEntities(beat);
    expect(new Set(now.map((e) => e.id)).size).toBe(now.length);
    for (const e of visibleEntities(beat - 1))
      expect(now.find((n) => n.id === e.id)).toEqual(e);
    for (const e of now) {
      expect(e.x).toBeGreaterThanOrEqual(0);
      expect(e.x + e.w).toBeLessThanOrEqual(880);
      expect(e.y + e.h).toBeLessThanOrEqual(380);
    }
  }
  expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1);
  expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1);
});
it("I-34 opening conversation accumulates you prompt skill and question connection", () => {
  const { container, rerender } = render(<Scene payload={1} />);
  expect(container.querySelectorAll("[data-presentation-entity]")).toHaveLength(
    2,
  );
  expect(screen.getByText("you")).toBeTruthy();
  expect(screen.getByText("a topic")).toBeTruthy();
  rerender(<Scene payload={2} />);
  expect(screen.getByText("the skill")).toBeTruthy();
  expect(screen.getByText("one question at a time")).toBeTruthy();
  const arrow=screen.getByLabelText('two-way conversation');
  const line=arrow.querySelector('line')!;
  const you=entities.find(e=>e.id==='you')!,skill=entities.find(e=>e.id==='skill')!,connection=entities.find(e=>e.id==='conversation')!,prompt=entities.find(e=>e.id==='prompt')!;
  expect(connection.x+Number(line.getAttribute('x1'))).toBe(you.x+you.w);
  expect(connection.x+Number(line.getAttribute('x2'))).toBe(skill.x);
  expect(connection.y+Number(line.getAttribute('y1'))).toBe(you.y+you.h/2);
  expect(prompt.y).toBeGreaterThan(connection.y+connection.h);
  expect(arrow.getAttribute('data-presentation-connection-from')).toBe('how-to:you');
  expect(arrow.getAttribute('data-presentation-connection-to')).toBe('how-to:skill');
});
it("I-35 tray cards morph links ghost and user-depth additions", () => {
  const { container, rerender } = render(<Scene payload={3} />);
  expect(screen.getByText("title · caption · visual")).toBeTruthy();
  expect(container.querySelector(".entity-tray")).toBeTruthy();
  rerender(<Scene payload={5} />);
  expect(screen.getAllByText("title · caption · visual")).toHaveLength(3);
  expect(screen.getAllByText("morph")).toHaveLength(2);
  expect(screen.getByText("your next beat")).toBeTruthy();
  expect(screen.getByText("partial ↔ full")).toBeTruthy();
  const you = entities.find((e) => e.id === "you")!,
    depth = entities.find((e) => e.id === "depth")!;
  expect(depth.x).toBe(you.x);
});
it("I-36 kit socket at tray bottom and verification in card row", () => {
  render(<Scene payload={7} />);
  expect(screen.getByText("↳ shared scene kit")).toBeTruthy();
  expect(screen.getByText("✓ verify")).toBeTruthy();
  expect(screen.getByText("build + render")).toBeTruthy();
  const tray = entities.find((e) => e.id === "tray")!,
    kit = entities.find((e) => e.id === "kit")!;
  expect(Math.abs(kit.y - (tray.y + tray.h))).toBeLessThan(5);
  expect(entities.find((e) => e.id === "verify")!.y).toBe(
    entities.find((e) => e.id === "card1")!.y,
  );
});
it("I-37 modify flags a card and reveal surrounds existing composition", () => {
  const { container } = render(<Scene payload={9} />);
  expect(screen.getByText("↶ point at a step · edit in place")).toBeTruthy();
  expect(screen.getByLabelText("modify arc to edited card").querySelector("path")?.getAttribute("d")).toContain("20 85");
  expect(container.querySelector(".entity-card2.edited")).toBeTruthy();
  expect(screen.getByText("YOU’RE LOOKING AT ONE")).toBeTruthy();
  const frame = entities.find((e) => e.id === "reveal")!;
  for (const e of entities.filter((e) => e.id !== "reveal")) {
    expect(e.x).toBeGreaterThan(frame.x);
    expect(e.x + e.w).toBeLessThan(frame.x + frame.w);
    expect(e.y).toBeGreaterThan(frame.y);
    expect(e.y + e.h).toBeLessThan(frame.y + frame.h);
  }
});
