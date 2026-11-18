import { describe, it, expect } from "vitest";
import { useEffect } from "react";
import {
  render,
  screen,
  fireEvent,
  renderHook,
  act,
  waitFor,
} from "@testing-library/react";
import { Presentation } from "../src/presentation-kit/Presentation";
import { Stage } from "../src/presentation-kit/Stage";
import { stageKey } from "../src/presentation-kit/stageKey";
import { Box } from "../src/presentation-kit/nodes/Box";
import { Arrow } from "../src/presentation-kit/nodes/Arrow";
import { Label } from "../src/presentation-kit/nodes/Label";
import { Frame } from "../src/presentation-kit/nodes/Frame";
import { Emphasis } from "../src/presentation-kit/nodes/Emphasis";
import { SymbolChip } from "../src/presentation-kit/nodes/SymbolChip";
import { Appear, SceneLayer } from "../src/presentation-kit/nodes/primitives";
import { usePresentationNav } from "../src/presentation-kit/usePresentationNav";
import { fitScale, useFitScale } from "../src/presentation-kit/useFitScale";
import {
  entityMotion,
  newcomerMotion,
  LAYOUT_T,
  DESIGN_W,
  DESIGN_H,
} from "../src/presentation-kit/constants";
import type { SceneProps, Step } from "../src/presentation-kit/types";
function Scene({ payload }: SceneProps<number>) {
  return (
    <Box id="fixed" style={{ position: "absolute", left: payload, top: 20 }}>
      State {payload}
    </Box>
  );
}
const steps: Step<number>[] = [0, 1, 2].map((i) => ({
  id: `s${i}`,
  era: i < 2 ? "first" : "second",
  title: `Title ${i}`,
  caption: `Paragraph ${i}`,
  Scene,
  payload: i,
  groupKey: "shared",
}));
const key = (k: string, target: Element | Window = window) =>
  fireEvent.keyDown(target, { key: k });
describe("scene contracts", () => {
  it("I-1 metadata selection and position-derived numbering survives insertion removal reorder", () => {
    const { rerender, container } = render(
      <Presentation title="Test" steps={steps} />,
    );
    expect(screen.getByText("Title 0")).toBeTruthy();
    expect(screen.getByText("Paragraph 0")).toBeTruthy();
    expect(
      container.querySelector("[data-presentation-marker]")?.textContent,
    ).toContain("01");
    const changed = [steps[2], steps[0]];
    rerender(<Presentation title="Test" steps={changed} />);
    expect(screen.getByText("Title 2")).toBeTruthy();
    key("ArrowRight");
    expect(
      container.querySelector("[data-presentation-marker]")?.textContent,
    ).toContain("02");
    rerender(<Presentation title="Test" steps={[steps[1], ...changed]} />);
    expect(screen.getByText("Title 2")).toBeTruthy();
    rerender(<Presentation title="Test" steps={[steps[0]]} />);
    expect(screen.getByText("Title 0")).toBeTruthy();
  });
  it("I-3 persistent identity, sequenced entry, exit and style hooks", () => {
    const { container, rerender } = render(
      <Box
        id="stable"
        className="local"
        data-extra="yes"
        style={{ left: 50, color: "red" }}
      >
        old
      </Box>,
    );
    const node = container.firstElementChild;
    rerender(
      <Box id="stable" className="local" style={{ left: 90, color: "blue" }}>
        new
      </Box>,
    );
    expect(container.firstElementChild).toBe(node);
    expect(node?.getAttribute("data-presentation-entity")).toBe("stable");
    expect(entityMotion.layout).toBe(true);
    expect(entityMotion.exit.opacity).toBe(0);
    expect(entityMotion.transition.layout.duration).toBe(LAYOUT_T);
    expect(newcomerMotion.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T);
    expect(newcomerMotion.initial.opacity).toBe(0);
    expect(newcomerMotion.animate.opacity).toBe(1);
    expect(node?.getAttribute("style")).toContain("left: 90px");
  });
  it("I-4 grouped instance persists with new payload, different group or Scene changes identity", () => {
    let mounts = 0,
      unmounts = 0;
    function Persistent({ payload }: SceneProps<number>) {
      useEffect(() => {
        mounts++;
        return () => {
          unmounts++;
        };
      }, []);
      return <span>{payload}</span>;
    }
    const a = { ...steps[0], Scene: Persistent },
      b = { ...steps[1], Scene: Persistent };
    const { rerender } = render(<Stage step={a} mode="browse" />);
    rerender(<Stage step={b} mode="browse" />);
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);
    expect(screen.getByText("1")).toBeTruthy();
    expect(stageKey(a)).toBe(stageKey(b));
    expect(stageKey({ ...b, groupKey: "other" })).not.toBe(stageKey(a));
    expect(stageKey(steps[0])).not.toBe(stageKey(a));
    rerender(<Stage step={{ ...b, groupKey: "other" }} mode="browse" />);
    expect(mounts).toBe(2);
  });
  it("I-5 continuing nodes have no newcomer wrapper and author stacking remains intact", () => {
    const { container } = render(
      <SceneLayer>
        <Box
          key="back" id="back"
          style={{ position: "absolute", left: 10, top: 10, zIndex: 1 }}
        >
          back
        </Box>
        <Box
          key="front" id="front"
          style={{ position: "absolute", left: 10, top: 10, zIndex: 2 }}
        >
          front
        </Box>
        <Appear key="newcomer">
          <Box id="new">new</Box>
        </Appear>
      </SceneLayer>,
    );
    expect(
      container
        .querySelector('[data-presentation-entity="front"]')
        ?.closest("[data-presentation-appear]"),
    ).toBeNull();
    expect(
      container
        .querySelector('[data-presentation-entity="front"]')
        ?.getAttribute("style"),
    ).toContain("z-index: 2");
    expect(
      container.querySelectorAll("[data-presentation-appear]"),
    ).toHaveLength(1);
  });
  it("I-6 every primitive forwards stable hooks coordinates and local styling without defaults", () => {
    const { container } = render(
      <>
        {[Box, Label, Arrow, Frame, Emphasis, SymbolChip].map((Node, i) => (
          <Node
            key={i}
            id={`e${i}`}
            className="owned"
            data-custom="ok"
            style={{ left: 33 }}
          >
            label
          </Node>
        ))}
      </>,
    );
    for (const node of container.children) {
      expect(node.className).toBe("owned");
      expect(node.getAttribute("data-custom")).toBe("ok");
      expect(node.getAttribute("style")).toBe("left: 33px;");
      expect(node.getAttribute("data-presentation-node")).toBeTruthy();
    }
  });
  it("I-8 default linked attribution and opt-in brand", () => {
    const { container, rerender } = render(
      <Presentation steps={steps} title="Test" />,
    );
    const link = screen.getByText("made by and-scene");
    expect(link.getAttribute("href")).toBe(
      "https://github.com/Codagent-AI/and-scene",
    );
    expect(link.hasAttribute("data-presentation-attribution")).toBe(true);
    expect(link.getAttribute("style")).toContain("right: 16px");
    expect(container.querySelector("header a")).toBeNull();
    rerender(
      <Presentation steps={steps} title="Test" brand={<a href="/">Host</a>} />,
    );
    expect(container.querySelector("header a")?.textContent).toBe("Host");
  });
  it("I-9 present mode hides reading chrome and shows marker/title", () => {
    const { container } = render(
      <Presentation steps={steps} title="Test" initialMode="present" />,
    );
    expect(screen.getByText("Title 0")).toBeTruthy();
    expect(container.querySelector("[data-presentation-marker]")).toBeTruthy();
    for (const hook of ["caption", "toc", "navigation", "progress"])
      expect(container.querySelector(`[data-presentation-${hook}]`)).toBeNull();
  });
  it("I-10 browse mode includes caption controls and era table of contents", () => {
    const { container } = render(<Presentation steps={steps} title="Test" />);
    for (const hook of ["caption", "toc", "navigation", "progress"])
      expect(
        container.querySelector(`[data-presentation-${hook}]`),
      ).toBeTruthy();
    expect(
      screen
        .getByRole("navigation", { name: "Sections" })
        .querySelectorAll("button"),
    ).toHaveLength(2);
  });
  it("I-11 toggle preserves active position and initial mode", () => {
    const { container } = render(<Presentation steps={steps} title="Test" />);
    key("ArrowRight");
    key("p");
    expect(container.querySelector("main")?.dataset.stepIndex).toBe("1");
    expect(container.querySelector("main")?.dataset.presentationMode).toBe(
      "present",
    );
    key("P");
    expect(screen.getByText("Paragraph 1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Present/ }));
    expect(container.querySelector("main")?.dataset.stepIndex).toBe("1");
  });
  it("I-14 controls jump directly and ToC selects first step of era", () => {
    const { container } = render(<Presentation steps={steps} title="Test" />);
    fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByText("Title 1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(screen.getByText("Title 0")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Step 3: Title 2" }));
    expect(screen.getByText("Title 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "first" }));
    expect(container.querySelector("main")?.dataset.stepIndex).toBe("0");
  });
  it("I-15 semantic active hooks update on sequential navigation and direct jumps", () => {
    const { container } = render(<Presentation steps={steps} title="Test" />);
    key("ArrowRight");
    expect(
      screen
        .getByRole("button", { name: "Step 2: Title 1" })
        .getAttribute("aria-current"),
    ).toBe("step");
    fireEvent.click(screen.getByRole("button", { name: "second" }));
    const active = container.querySelectorAll(
      '[data-presentation-active="true"]',
    );
    expect(active).toHaveLength(2);
    for (const a of active) expect(a.getAttribute("aria-current")).toBe("step");
    expect(
      screen
        .getByRole("button", { name: "first" })
        .hasAttribute("aria-current"),
    ).toBe(false);
  });
  it("I-16 boundary controls disable at ends and navigation never wraps", () => {
    render(<Presentation steps={steps} title="Test" />);
    expect(
      screen
        .getByRole("button", { name: "Previous step" })
        .hasAttribute("disabled"),
    ).toBe(true);
    key("ArrowLeft");
    expect(screen.getByText("Title 0")).toBeTruthy();
    key("ArrowRight");
    key("ArrowRight");
    key("ArrowRight");
    expect(screen.getByText("Title 2")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Next step" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
});
describe("navigation hook", () => {
  it("I-12 every key and focused interactive controls retain their own keys", () => {
    const { result } = renderHook(() => usePresentationNav(10));
    for (const k of ["ArrowRight", " ", "PageDown"]) act(() => key(k));
    expect(result.current.index).toBe(3);
    for (const k of ["ArrowLeft", "PageUp"]) act(() => key(k));
    expect(result.current.index).toBe(1);
    for (const tag of ["button", "a", "input", "select", "textarea", "div"]) {
      const el = document.createElement(tag);
      if (tag === "div") el.setAttribute("contenteditable", "true");
      document.body.append(el);
      for (const k of [" ", "ArrowRight", "PageDown", "P"])
        act(() => key(k, el));
      el.remove();
    }
    expect(result.current.index).toBe(1);
    expect(result.current.mode).toBe("browse");
    act(() => fireEvent.keyDown(window, { key: "ArrowRight", ctrlKey: true }));
    expect(result.current.index).toBe(1);
  });
  it("I-13 horizontal swipes navigate once, vertical short and orphan gestures do not", () => {
    const { result } = renderHook(() => usePresentationNav(3));
    const swipe = (x: number, y: number) => {
      act(() =>
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent),
      );
      act(() =>
        result.current.onTouchEnd({
          changedTouches: [{ clientX: x, clientY: y }],
        } as unknown as React.TouchEvent),
      );
    };
    swipe(10, 100);
    expect(result.current.index).toBe(1);
    swipe(190, 100);
    expect(result.current.index).toBe(0);
    swipe(90, 100);
    swipe(10, 300);
    expect(result.current.index).toBe(0);
    act(() =>
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 10, clientY: 100 }],
      } as unknown as React.TouchEvent),
    );
    expect(result.current.index).toBe(0);
  });
});
it("I-17 fit scaling uses default fixed dimensions, both modes, tiny viewports and resize", () => {
  expect([DESIGN_W, DESIGN_H]).toEqual([880, 380]);
  expect(fitScale(1440, 1000, "browse")).toBe(1);
  expect(fitScale(400, 800, "browse")).toBeCloseTo(336 / 880);
  expect(fitScale(400, 800, "present")).toBeCloseTo(352 / 880);
  expect(fitScale(1, 1, "browse")).toBe(0);
  expect(fitScale(1000, 400, "browse")).toBeCloseTo(80 / 380);
  const { result } = renderHook(() => useFitScale("browse"));
  act(() => {
    window.innerWidth = 400;
    window.innerHeight = 800;
    fireEvent(window, new Event("resize"));
  });
  expect(result.current).toBeCloseTo(336 / 880);
  const { container } = render(<Stage step={steps[0]} mode="browse" />);
  expect(
    container
      .querySelector("[data-presentation-canvas]")
      ?.getAttribute("style"),
  ).toContain("width: 880px");
  expect(
    container
      .querySelector("[data-presentation-entity]")
      ?.getAttribute("style"),
  ).toContain("top: 20px");
});

it("I-3 departing keyed entity remains for exit then unmounts", async () => {
  const { container, rerender } = render(
    <SceneLayer>
      <Box key="departing" id="departing">
        Departing
      </Box>
    </SceneLayer>,
  );
  rerender(<SceneLayer>{null}</SceneLayer>);
  expect(
    container.querySelector('[data-presentation-entity="departing"]'),
  ).toBeTruthy();
  await waitFor(
    () =>
      expect(
        container.querySelector('[data-presentation-entity="departing"]'),
      ).toBeNull(),
    { timeout: 1500 },
  );
});
it("I-10 table of contents responds to viewport width", () => {
  const { container } = render(
    <Presentation steps={steps} title="Responsive" />,
  );
  act(() => {
    window.innerWidth = 1400;
    fireEvent(window, new Event("resize"));
  });
  expect(container.querySelector("[data-presentation-toc]")).toBeTruthy();
  act(() => {
    window.innerWidth = 390;
    fireEvent(window, new Event("resize"));
  });
  expect(container.querySelector("[data-presentation-toc]")).toBeNull();
});

it("I-12 editable attributes and custom interactive roles keep navigation keys",()=>{
 const {result}=renderHook(()=>usePresentationNav(4));
 for(const value of ["true","","plaintext-only"]){const control=document.createElement("div");control.setAttribute("contenteditable",value);document.body.append(control);act(()=>key("ArrowRight",control));control.remove()}
 for(const role of ["button","slider","textbox","combobox","listbox","tab","menuitem","checkbox","radio","switch","spinbutton"]){const control=document.createElement("div");control.setAttribute("role",role);document.body.append(control);act(()=>key("PageDown",control));control.remove()}
 expect(result.current.index).toBe(0);
 const plain=document.createElement("div");plain.setAttribute("contenteditable","false");document.body.append(plain);act(()=>key("ArrowRight",plain));plain.remove();expect(result.current.index).toBe(1);
})
