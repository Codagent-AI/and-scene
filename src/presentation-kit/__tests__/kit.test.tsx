import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Appear } from "../nodes/Appear";
import { Departing } from "../nodes/Departing";
import { Presentation } from "../Presentation";
import {
  DESIGN_H,
  DESIGN_W,
  ENTER_DELAY,
  ENTER_T,
  LAYOUT_T,
  MIN_SCALE,
} from "../constants";
import { computeFitScale } from "../useFitScale";
import { isInteractiveTarget } from "../usePresentationNav";
import type { SceneProps, Step } from "../types";

type Payload = { text: string };

function Scene({ payload }: SceneProps<Payload>) {
  return <div>{payload.text}</div>;
}

const steps: Step<Payload>[] = [
  {
    id: "a",
    era: "start",
    title: "First",
    caption: "Intro",
    Scene,
    payload: { text: "one" },
    groupKey: "same",
  },
  {
    id: "b",
    era: "start",
    title: "Second",
    caption: "More",
    Scene,
    payload: { text: "two" },
    groupKey: "same",
  },
  {
    id: "c",
    era: "end",
    title: "Third",
    caption: "Done",
    Scene,
    payload: { text: "three" },
  },
];

function getRoot() {
  return document.querySelector<HTMLElement>("[data-presentation-root]")!;
}

function getStepIndex() {
  return Number(getRoot().dataset.stepIndex);
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  fireEvent(window, new Event("resize"));
}

afterEach(cleanup);

describe("presentation kit", () => {
  it("requires complete step identity and narration fields", () => {
    for (const step of steps) {
      expect(step.id).toBeTruthy();
      expect(step.era).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.caption).toBeTruthy();
      expect(step.Scene).toBe(Scene);
      expect(step.payload.text).toBeTruthy();
    }
  });

  it("accepts a strongly typed payload array at the Presentation boundary", () => {
    const typedSteps: Step<Payload>[] = steps;
    expectTypeOf(typedSteps).toMatchTypeOf<readonly Step<Payload>[]>();
    render(
      <Presentation
        steps={typedSteps}
        title="Typed"
        initialMode="present"
        attribution={false}
      />,
    );
    expect(screen.getByText("one")).toBeTruthy();
  });

  it("derives displayed numbering from order after insertions and reordering", () => {
    const view = render(
      <Presentation
        steps={steps}
        title="Demo"
        initialMode="browse"
        attribution={false}
      />,
    );
    const getNumbers = () =>
      [...document.querySelectorAll("[data-presentation-progress]")].map(
        (node) => node.textContent,
      );

    expect(getNumbers()).toEqual(["1", "2", "3"]);
    const inserted = { ...steps[0]!, id: "new", title: "Inserted" };
    const withInsertion = [steps[0]!, inserted, steps[1]!, steps[2]!];
    view.rerender(
      <Presentation
        steps={withInsertion}
        title="Demo"
        initialMode="browse"
        attribution={false}
      />,
    );
    expect(getNumbers()).toEqual(["1", "2", "3", "4"]);

    const reordered = [steps[2]!, steps[0]!];
    view.rerender(
      <Presentation
        steps={reordered}
        title="Demo"
        initialMode="browse"
        attribution={false}
      />,
    );
    expect(getNumbers()).toEqual(["1", "2"]);
    expect(screen.getByText("three")).toBeTruthy();
  });

  it("exposes chrome root hooks and honors initialMode", () => {
    render(
      <Presentation
        steps={steps}
        title="Demo"
        initialMode="browse"
        attribution={false}
      />,
    );
    expect(getRoot().getAttribute("data-step-count")).toBe("3");
    expect(getRoot().getAttribute("data-step-index")).toBe("0");
    expect(getRoot().getAttribute("data-presentation-mode")).toBe("browse");

    cleanup();
    render(<Presentation steps={steps} title="Demo" attribution={false} />);
    expect(getRoot().getAttribute("data-presentation-mode")).toBe("present");
  });

  it("supports all forward and backward keyboard navigation keys", () => {
    const manySteps = Array.from({ length: 8 }, (_, index) => ({
      ...steps[0]!,
      id: `step-${index}`,
    }));
    render(
      <Presentation
        steps={manySteps}
        title="Keys"
        initialMode="present"
        attribution={false}
      />,
    );

    for (const key of ["ArrowRight", " ", "PageDown"]) {
      fireEvent.keyDown(window, { key });
    }
    expect(getStepIndex()).toBe(3);
    for (const key of ["ArrowLeft", "PageUp"]) {
      fireEvent.keyDown(window, { key });
    }
    expect(getStepIndex()).toBe(1);
  });

  it("toggles mode with P without changing the active step", () => {
    render(
      <Presentation
        steps={steps}
        title="Demo"
        initialMode="present"
        attribution={false}
      />,
    );
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "p" });
    expect(getRoot().getAttribute("data-presentation-mode")).toBe("browse");
    expect(getStepIndex()).toBe(1);
    fireEvent.keyDown(window, { key: "P" });
    expect(getRoot().getAttribute("data-presentation-mode")).toBe("present");
    expect(getStepIndex()).toBe(1);
  });

  it("ignores navigation and mode keys while a modifier is held", () => {
    render(
      <Presentation
        steps={steps}
        title="Modifiers"
        initialMode="present"
        attribution={false}
      />,
    );
    fireEvent.keyDown(window, { key: "p", ctrlKey: true });
    fireEvent.keyDown(window, { key: "p", metaKey: true });
    fireEvent.keyDown(window, { key: "ArrowRight", altKey: true });
    expect(getRoot().getAttribute("data-presentation-mode")).toBe("present");
    expect(getStepIndex()).toBe(0);
  });

  it("clamps the active step when the steps list shrinks and tolerates none", () => {
    const { rerender } = render(
      <Presentation steps={steps} title="Shrink" attribution={false} />,
    );
    fireEvent.keyDown(window, { key: "End" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(getStepIndex()).toBe(2);

    rerender(
      <Presentation steps={steps.slice(0, 2)} title="Shrink" attribution={false} />,
    );
    expect(getStepIndex()).toBe(1);

    rerender(<Presentation steps={[]} title="Shrink" attribution={false} />);
    expect(document.querySelector("[data-presentation-root]")).toBeNull();
  });

  it("clamps at both ends and ignores navigation keys on controls", () => {
    render(
      <Presentation
        steps={steps}
        title="Demo"
        initialMode="present"
        attribution={false}
      />,
    );
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(getStepIndex()).toBe(0);
    for (let index = 0; index < 5; index++) {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    }
    expect(getStepIndex()).toBe(2);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(getStepIndex()).toBe(2);

    const button = screen.getByLabelText("Toggle presentation mode");
    const input = document.createElement("input");
    const link = document.createElement("a");
    document.body.append(input, link);
    for (const control of [button, input, link]) {
      fireEvent.keyDown(control, { key: "ArrowLeft" });
      fireEvent.keyDown(control, { key: "p" });
    }
    expect(getStepIndex()).toBe(2);
    expect(getRoot().getAttribute("data-presentation-mode")).toBe("present");
    input.remove();
    link.remove();
  });

  it("navigates left and right on horizontal swipes", () => {
    render(
      <Presentation
        steps={steps}
        title="Demo"
        initialMode="present"
        attribution={false}
      />,
    );
    const root = getRoot();
    fireEvent.touchStart(root, { changedTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(root, { changedTouches: [{ clientX: 100 }] });
    expect(getStepIndex()).toBe(1);
    fireEvent.touchStart(root, { changedTouches: [{ clientX: 100 }] });
    fireEvent.touchEnd(root, { changedTouches: [{ clientX: 200 }] });
    expect(getStepIndex()).toBe(0);
  });

  it("jumps by progress and to the first step of a ToC era", () => {
    render(
      <Presentation
        steps={steps}
        title="Demo"
        initialMode="browse"
        attribution={false}
      />,
    );
    fireEvent.click(screen.getByLabelText("Step 2"));
    expect(getStepIndex()).toBe(1);
    fireEvent.click(screen.getByText("end"));
    expect(getStepIndex()).toBe(2);
    fireEvent.click(screen.getByText("start"));
    expect(getStepIndex()).toBe(0);
  });

  it("groups ToC entries by era and exposes active state semantics", () => {
    render(
      <Presentation
        steps={steps}
        title="Demo"
        initialMode="browse"
        attribution={false}
      />,
    );
    const entries = [
      ...document.querySelectorAll("[data-presentation-toc-entry]"),
    ];
    expect(entries.map((entry) => entry.textContent)).toEqual(["start", "end"]);
    const activeProgress = document.querySelector(
      '[data-presentation-progress][aria-current="step"][data-active="true"]',
    );
    const activeToc = document.querySelector(
      '[data-presentation-toc-entry][aria-current="true"][data-active="true"]',
    );
    expect(activeProgress).toBeTruthy();
    expect(activeToc).toBeTruthy();
  });

  it("shows only title and marker in present mode, and browse controls in browse mode", () => {
    render(
      <Presentation
        steps={steps}
        title="Demo"
        initialMode="present"
        attribution={false}
      />,
    );
    expect(
      document.querySelector("[data-presentation-step-marker]"),
    ).toBeTruthy();
    expect(document.querySelector("[data-presentation-title]")).toBeTruthy();
    expect(document.querySelector("[data-presentation-caption]")).toBeNull();
    expect(document.querySelector("[data-presentation-toc]")).toBeNull();
    expect(screen.queryByLabelText("Previous step")).toBeNull();
    expect(screen.queryByLabelText("Next step")).toBeNull();
    expect(document.querySelector("[data-presentation-progress]")).toBeNull();

    fireEvent.click(screen.getByLabelText("Toggle presentation mode"));
    expect(document.querySelector("[data-presentation-caption]")).toBeTruthy();
    expect(screen.getByLabelText("Previous step")).toBeTruthy();
    expect(screen.getByLabelText("Next step")).toBeTruthy();
    expect(document.querySelector("[data-presentation-progress]")).toBeTruthy();
  });

  it("shows the ToC only on wide browse viewports and reacts to resize", () => {
    const originalWidth = window.innerWidth;
    setViewportWidth(1024);
    render(
      <Presentation
        steps={steps}
        title="Demo"
        initialMode="browse"
        attribution={false}
      />,
    );
    expect(document.querySelector("[data-presentation-toc]")).toBeTruthy();
    setViewportWidth(600);
    expect(document.querySelector("[data-presentation-toc]")).toBeNull();
    setViewportWidth(originalWidth);
  });

  it("keeps grouped scenes mounted and remounts an ungrouped scene", () => {
    let mounts = 0;
    function Count({ payload }: SceneProps<Payload>) {
      useEffect(() => {
        mounts++;
      }, []);
      return <div>{payload.text}</div>;
    }
    const local = steps.map((step) => ({ ...step, Scene: Count }));
    render(
      <Presentation
        steps={local}
        title="x"
        initialMode="present"
        attribution={false}
      />,
    );
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(mounts).toBe(1);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(mounts).toBe(2);
  });

  it("sequences newcomer Appear after the layout transition and leaves persisters plain", () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T.duration);
    const { container, rerender } = render(
      <Appear>
        <span>new entity</span>
      </Appear>,
    );
    expect(container.querySelector("[data-presentation-appear]")).toBeTruthy();
    expect(ENTER_T).toBeGreaterThan(0);
    rerender(
      <Appear isNew={false}>
        <span>persistent entity</span>
      </Appear>,
    );
    expect(container.querySelector("[data-presentation-appear]")).toBeNull();
    expect(container.firstElementChild?.tagName).toBe("SPAN");
  });

  it("animates a departing entity out before unmounting it", async () => {
    const { container, rerender } = render(
      <Departing show>
        <span>leaving entity</span>
      </Departing>,
    );
    expect(container.textContent).toContain("leaving entity");

    rerender(
      <Departing show={false}>
        <span>leaving entity</span>
      </Departing>,
    );
    // Still mounted while the exit animation runs, then removed.
    expect(container.querySelector("[data-presentation-departing]")).toBeTruthy();
    await waitFor(() =>
      expect(container.querySelector("[data-presentation-departing]")).toBeNull(),
    );
  });

  it("calculates uniform fit and enforces the minimum scale", () => {
    expect(DESIGN_W).toBe(880);
    expect(DESIGN_H).toBe(380);
    expect(computeFitScale(1000, 800, "present")).toBeCloseTo(
      Math.min(920 / 880, 656 / 380),
    );
    expect(computeFitScale(1, 1, "browse")).toBe(MIN_SCALE);
  });

  it("centers the scaled fixed canvas within a narrow viewport", () => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    setViewportWidth(390);
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
    render(<Presentation steps={steps} title="Narrow" initialMode="browse" attribution={false} />);
    const canvas = document.querySelector<HTMLElement>("[data-presentation-stage] > div")!;
    expect(canvas.style.left).toBe("calc(50% - 147px)");
    expect(canvas.style.transformOrigin).toBe("top left");
    setViewportWidth(originalWidth);
    Object.defineProperty(window, "innerHeight", { configurable: true, value: originalHeight });
  });

  it("shows default attribution, supports overrides, and has no default brand", () => {
    const { rerender } = render(
      <Presentation steps={steps} title="Demo" initialMode="present" />,
    );
    const link = screen.getByText("made by and-scene") as HTMLAnchorElement;
    expect(link.href).toBe("https://github.com/Codagent-AI/and-scene");
    expect(link.hasAttribute("data-presentation-attribution")).toBe(true);
    expect(document.querySelector("[data-presentation-header] a")).toBeNull();

    rerender(
      <Presentation
        steps={steps}
        title="Demo"
        initialMode="present"
        attribution={{ label: "Custom credit", href: "https://example.com" }}
      />,
    );
    const custom = screen.getByText("Custom credit") as HTMLAnchorElement;
    expect(custom.href).toBe("https://example.com/");
    expect(custom.hasAttribute("data-presentation-attribution")).toBe(true);

    rerender(
      <Presentation
        steps={steps}
        title="Demo"
        initialMode="present"
        attribution={false}
      />,
    );
    expect(
      document.querySelector("[data-presentation-attribution]"),
    ).toBeNull();
  });

  it("guards interactive targets", () => {
    expect(isInteractiveTarget(document.createElement("button"))).toBe(true);
    expect(isInteractiveTarget(document.createElement("input"))).toBe(true);
    expect(isInteractiveTarget(document.createElement("a"))).toBe(true);
    expect(isInteractiveTarget(document.createElement("div"))).toBe(false);
  });

  it("documents all public hooks and the overlap exemption", () => {
    const readme = readFileSync(
      join(process.cwd(), "src/presentation-kit/README.md"),
      "utf8",
    );
    const hooks = [
      "data-presentation-root",
      "data-step-count",
      "data-step-index",
      "data-presentation-mode",
      "data-presentation-mode-toggle",
      "data-presentation-header",
      "data-presentation-footer",
      "data-presentation-title",
      "data-presentation-step-marker",
      "data-presentation-caption",
      "data-presentation-attribution",
      "data-presentation-progress",
      "data-presentation-toc",
      "data-presentation-toc-entry",
      "data-presentation-stage",
      "data-presentation-node",
      "data-presentation-appear",
      "data-entity-id",
      "data-presentation-allow-overlap",
    ];
    for (const hook of hooks) expect(readme).toContain(hook);
  });

  it("keeps kit source style-neutral and free of Tailwind references", () => {
    const directory = join(process.cwd(), "src/presentation-kit");
    const files = (path: string): string[] =>
      readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? files(join(path, entry.name))
          : [join(path, entry.name)],
      );
    const source = files(directory)
      .filter(
        (path) => /\.(tsx?|css)$/.test(path) && !path.includes("/__tests__/"),
      )
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const forbiddenProperties = [
      "color",
      "background(?:Color|Image)?",
      "font(?:Family|Size|Weight|Style)?",
      "border(?:Color|Width|Style|Radius)?",
      "boxShadow",
      "textShadow",
    ];
    const forbiddenStyleProperty = new RegExp(
      `\\b(?:${forbiddenProperties.join("|")})\\s*:`,
      "i",
    );

    expect(source).not.toMatch(forbiddenStyleProperty);
    expect(source.toLowerCase()).not.toContain("tailwind");
  });
});
