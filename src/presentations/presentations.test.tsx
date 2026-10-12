import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Landing } from "../Landing";
import { Presentation } from "../presentation-kit";
import { presentations } from "./index";
import { resolveRoute } from "./routing";
import { steps } from "./how-to-make-a-presentation/steps";

const sample = {
  titles: ["You have a topic", "The skill interviews you", "Answers become steps", "The deck grows", "You set the depth", "It assembles the scene", "It checks its own work", "Changed your mind? Loop it.", "You're looking at one"],
  captions: [
    "It starts with you, a topic, and mild overconfidence.",
    "One question at a time: the topic, the look, then each beat of the story.",
    "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
    "Same shapes, new beats. Every answer extends the story without redrawing it.",
    "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
    "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
    "Before saying done, it builds and renders every step — and fixes what breaks.",
    "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
    "This presentation was built exactly this way. Thanks for watching.",
  ],
  eras: ["the ask", "the ask", "the gathering", "the gathering", "the gathering", "the build", "the build", "the loop", "the reveal"],
};

afterEach(cleanup);

describe("presentation registry and sample", () => {
  it("has unique slug/title/load entries and loads the registered sample", async () => {
    expect(new Set(presentations.map(({ slug }) => slug)).size).toBe(presentations.length);
    expect(presentations.every(({ slug, title, load }) => slug && title && typeof load === "function")).toBe(true);
    const loaded = await presentations[0]!.load();
    expect(loaded.default).toBeTruthy();
    expect(presentations.some(({ slug }) => slug === "how-to-make-a-presentation")).toBe(true);
  });

  it("matches the normative nine-step table exactly", () => {
    expect(steps).toHaveLength(9);
    expect(new Set(steps.map(({ id }) => id)).size).toBe(9);
    expect(steps.map(({ title }) => title)).toEqual(sample.titles);
    expect(steps.map(({ caption }) => caption)).toEqual(sample.captions);
    expect(steps.map(({ era }) => era)).toEqual(sample.eras);
  });

  it("resolves root, slug, unknown paths, and a trailing slash", () => {
    const [entry] = presentations;
    expect(resolveRoute("/", presentations)).toBeNull();
    expect(resolveRoute("/how-to-make-a-presentation", presentations)).toBe(entry);
    expect(resolveRoute("/how-to-make-a-presentation/", presentations)).toBe(entry);
    expect(resolveRoute("/missing", presentations)).toBeNull();
  });

  it("lists registry entries as plain links", () => {
    render(<Landing />);
    const link = screen.getByRole("link", { name: /How to Use This Skill to Make a Presentation/ });
    expect(link.getAttribute("href")).toBe("/how-to-make-a-presentation");
  });

  it("renders every scene step and advances the public hooks", () => {
    render(<Presentation steps={steps} title="Sample" initialMode="browse" attribution={false} />);
    const root = document.querySelector<HTMLElement>("[data-presentation-root]")!;
    expect(root.dataset.stepCount).toBe("9");
    for (let index = 0; index < steps.length; index += 1) {
      expect(document.querySelector(`[data-stage="${index + 1}"]`)).toBeTruthy();
      if (index < steps.length - 1) {
        fireEvent.keyDown(window, { key: "ArrowRight" });
        expect(root.dataset.stepIndex).toBe(String(index + 1));
      }
    }
  });

  it("reserves space between present titles and the mode toggle", async () => {
    const stylesheet = await readFile(
      path.resolve(process.cwd(), "src/presentations/how-to-make-a-presentation/talk.css"),
      "utf8",
    );
    expect(stylesheet).toMatch(/\[data-presentation-root\]\[data-presentation-mode="present"\]\s+\[data-presentation-title\]\s*\{[^}]*margin-right:\s*(?:9[0-9]|[1-9][0-9]{2,})px/s);
  });
});
