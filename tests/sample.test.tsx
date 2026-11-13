import { render, cleanup } from "@testing-library/react";
import Story from "../src/presentations/how-to-make-a-presentation/steps/Story";
afterEach(cleanup);
import { expect, it, afterEach } from "vitest";
import {
  entitiesAt,
  sampleMeta,
} from "../src/presentations/how-to-make-a-presentation/entities";
import { validateSample } from "../scripts/sample-contract.mjs";
it("I-29 exact canonical outline and malformed samples fail", () => {
  expect(() => validateSample(sampleMeta)).not.toThrow();
  for (const bad of [
    [],
    sampleMeta.slice(1),
    [...sampleMeta].reverse(),
    sampleMeta.map((s, i) => (i === 0 ? { ...s, title: "wrong" } : s)),
  ])
    expect(() => validateSample(bad)).toThrow();
});
it("I-30 I-31 I-32 I-33 sample accumulates with fixed identity and geometry", () => {
  for (let step = 0; step < 9; step++) {
    const current = entitiesAt(step);
    expect(new Set(current.map((e) => e.id)).size).toBe(current.length);
    if (step) {
      for (const previous of entitiesAt(step - 1)) {
        const next = current.find((e) => e.id === previous.id)!;
        expect(next).toBeTruthy();
        expect([next.x, next.y]).toEqual([previous.x, previous.y]);
      }
    }
  }
  expect(entitiesAt(0).map((e) => e.id)).toEqual(["you", "prompt"]);
  expect(entitiesAt(1).some((e) => e.id === "question")).toBe(true);
  expect(entitiesAt(2).some((e) => e.id === "tray")).toBe(true);
  expect(entitiesAt(3).some((e) => e.id === "morph")).toBe(true);
  expect(entitiesAt(4).some((e) => e.id === "ghost")).toBe(true);
  expect(entitiesAt(5).find((e) => e.id === "kit")?.y).toBe(260);
  expect(entitiesAt(6).some((e) => e.id === "verify")).toBe(true);
  expect(entitiesAt(7).some((e) => e.id === "modify")).toBe(true);
  expect(entitiesAt(7).find((e) => e.id === "modify-link")?.y).toBe(104);
  expect(entitiesAt(8).some((e) => e.id === "reveal")).toBe(true);
});

it("I-33 verification is chained from the last card in the tray row", () => {
  expect(entitiesAt(5).some((e) => e.id === "verify-link")).toBe(false);
  const entities = entitiesAt(6),
    card = entities.find((e) => e.id === "card3")!,
    verify = entities.find((e) => e.id === "verify")!,
    link = entities.find((e) => e.id === "verify-link")!;
  expect(link).toBeTruthy();
  expect(link.connects).toEqual(["card3", "verify"]);
  expect(link.label).toBe("→");
  render(<Story payload={6} />);
  const rendered = document.querySelector('[data-entity="verify-link"]');
  expect(rendered?.textContent).toBe("→");
  expect(rendered?.getAttribute("data-connects")).toBe("card3 verify");
  expect(link.x).toBe(card.x + card.w);
  expect(link.x + link.w).toBe(verify.x);
  expect(link.y + link.h / 2).toBe(card.y + card.h / 2);
  expect(link.y + link.h / 2).toBe(verify.y + verify.h / 2);
});
