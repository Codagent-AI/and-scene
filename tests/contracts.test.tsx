import { StrictMode, useEffect } from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  renderHook,
  act,
} from "@testing-library/react";
import { Presentation } from "../src/presentation-kit/Presentation";
import { fitScale, useFitScale } from "../src/presentation-kit/useFitScale";
import {
  usePresentationNav,
  swipeDirection,
} from "../src/presentation-kit/usePresentationNav";
import { groupStart } from "../src/presentation-kit/Stage";
import {
  DESIGN_W,
  DESIGN_H,
  STAGE_LAYOUT,
  ENTER_DELAY,
  LAYOUT_T,
} from "../src/presentation-kit/constants";
import { Box } from "../src/presentation-kit/nodes/Box";
import { Label } from "../src/presentation-kit/nodes/Label";
import { Arrow } from "../src/presentation-kit/nodes/Arrow";
import { Frame } from "../src/presentation-kit/nodes/Frame";
import { Emphasis } from "../src/presentation-kit/nodes/Emphasis";
import { SymbolChip } from "../src/presentation-kit/nodes/SymbolChip";
import { SceneLayer } from "../src/presentation-kit/nodes/SceneLayer";
import { Appear } from "../src/presentation-kit/nodes/Appear";
import type { Step } from "../src/presentation-kit/types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const Scene = ({ payload }: { payload: { value: string } }) => (
  <div>{payload.value}</div>
);
const steps: Step<{ value: string }>[] = ["one", "two", "three"].map(
  (id, i) => ({
    id,
    era: i < 2 ? "first" : "second",
    title: id,
    caption: `Caption ${id}`,
    Scene,
    payload: { value: `state ${id}` },
    groupKey: "shared",
  }),
);
const index = () =>
  Number(
    document
      .querySelector("[data-step-index]")
      ?.getAttribute("data-step-index"),
  );
describe("presentation contracts", () => {
  it("I-18 metadata and order-derived numbering follow changed arrays", () => {
    const { rerender } = render(<Presentation steps={steps} title="Test" />);
    expect(screen.getByText("Caption one")).toBeTruthy();
    expect(screen.getByText("state one")).toBeTruthy();
    expect(
      document.querySelector("[data-presentation-marker]")?.textContent,
    ).toContain("01 / 03 · first");
    fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(index()).toBe(1);
    rerender(<Presentation steps={[steps[2], steps[0]]} title="Test" />);
    expect(screen.getByText("Caption one")).toBeTruthy();
    expect(
      document.querySelector("[data-presentation-marker]")?.textContent,
    ).toContain("02 / 02");
  });
  it("I-20 motion identity and newcomer timing remain stable", () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T);
    const { rerender } = render(
      <Appear>
        <Box id="persist">old</Box>
      </Appear>,
    );
    const entity = document.querySelector(
      '[data-presentation-entity="persist"]',
    );
    const wrapper = entity?.parentElement;
    rerender(
      <Appear>
        <Box id="persist" style={{ left: 100, width: 200 }}>
          new
        </Box>
      </Appear>,
    );
    expect(document.querySelector('[data-presentation-entity="persist"]')).toBe(
      entity,
    );
    expect(entity?.parentElement).toBe(wrapper);
    expect(entity?.textContent).toBe("new");
  });
  it("I-21 grouped scene retains mounted instance and updates payload", () => {
    const mounted = vi.fn(),
      unmounted = vi.fn();
    function Persistent({ payload }: { payload: { value: string } }) {
      useEffect(() => {
        mounted();
        return unmounted;
      }, []);
      return <Box id="same">{payload.value}</Box>;
    }
    const grouped = steps.map((s) => ({ ...s, Scene: Persistent }));
    render(<Presentation steps={grouped} title="Test" />);
    const entity = document.querySelector('[data-presentation-entity="same"]');
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(unmounted).not.toHaveBeenCalled();
    expect(entity?.textContent).toBe("state two");
    expect(groupStart(grouped, 2)).toBe(0);
    expect(
      groupStart([grouped[0], { ...grouped[1], groupKey: "other" }], 1),
    ).toBe(1);
    expect(groupStart([grouped[0], { ...grouped[1], Scene }], 1)).toBe(1);
    expect(
      groupStart([grouped[0], { ...grouped[1], groupKey: undefined }], 1),
    ).toBe(1);
  });
  it("I-22 coordinate and overlapping composition props are preserved", () => {
    render(
      <SceneLayer>
        <Box
          id="a"
          style={{ position: "absolute", left: 20, top: 10, width: 80 }}
        />
        <Box
          id="b"
          style={{ position: "absolute", left: 20, top: 10, width: 80 }}
        />
      </SceneLayer>,
    );
    const boxes = [
      ...document.querySelectorAll("[data-presentation-node]"),
    ] as HTMLElement[];
    expect(
      boxes.map((b) => [b.style.left, b.style.top, b.style.width]),
    ).toEqual([
      ["20px", "10px", "80px"],
      ["20px", "10px", "80px"],
    ]);
    expect(
      document.querySelector<HTMLElement>("[data-presentation-layer]")?.style
        .position,
    ).toBe("absolute");
  });
  it("I-23 all primitives forward semantic hooks and author treatments", () => {
    for (const Node of [Box, Label, Arrow, Frame, Emphasis, SymbolChip]) {
      const { unmount } = render(
        <Node
          id="id"
          className="local"
          data-custom="ok"
          style={{ color: "red" }}
        >
          content
        </Node>,
      );
      const node = document.querySelector<HTMLElement>(
        "[data-presentation-node]",
      )!;
      expect(node.getAttribute("data-presentation-entity")).toBe("id");
      expect(node.className).toBe("local");
      expect(node.dataset.custom).toBe("ok");
      expect(node.style.color).toBe("red");
      unmount();
    }
  });
  it("I-24 default attribution has the named repository hook and bottom-right slot", () => {
    render(<Presentation steps={steps} title="Test" />);
    const a = screen.getByRole("link", { name: "made by and-scene" });
    expect(a.getAttribute("href")).toBe(
      "https://github.com/Codagent-AI/and-scene",
    );
    expect(a.hasAttribute("data-presentation-attribution")).toBe(true);
    expect(a.parentElement?.style.right).toBe("12px");
    expect(a.parentElement?.style.bottom).toBe("8px");
  });
  it("I-25 branding is opt-in", () => {
    const { rerender } = render(<Presentation steps={steps} title="Test" />);
    expect(document.querySelector("[data-presentation-brand]")).toBeNull();
    rerender(
      <Presentation
        steps={steps}
        title="Test"
        brand={<a href="/host">Host</a>}
      />,
    );
    expect(screen.getByRole("link", { name: "Host" })).toBeTruthy();
  });
  it("I-26 present mode hides reading chrome and exposes marker/title", () => {
    render(<Presentation steps={steps} title="Test" initialMode="present" />);
    expect(
      document.querySelector("[data-presentation-present-title]")?.textContent,
    ).toBe("one");
    for (const hook of ["caption", "toc", "controls", "progress"])
      expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull();
    expect(document.querySelector("[data-presentation-marker]")).toBeTruthy();
  });
  it("I-27 browse mode exposes captions controls progress and era toc", () => {
    render(<Presentation steps={steps} title="Test" />);
    expect(screen.getByText("Caption one")).toBeTruthy();
    expect(
      document.querySelectorAll("[data-presentation-progress-entry]"),
    ).toHaveLength(3);
    expect(
      document.querySelectorAll("[data-presentation-toc-entry]"),
    ).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Previous step" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next step" })).toBeTruthy();
  });
  it("I-28 initial mode and P/button toggles preserve step and change geometry", () => {
    render(<Presentation steps={steps} title="Test" initialMode="browse" />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    const stage = document.querySelector<HTMLElement>(
      "[data-presentation-stage]",
    )!;
    expect(stage.style.top).toBe(`${STAGE_LAYOUT.browse.top}px`);
    fireEvent.keyDown(window, { key: "p" });
    expect(index()).toBe(1);
    expect(stage.style.top).toBe(`${STAGE_LAYOUT.present.top}px`);
    fireEvent.click(
      screen.getByRole("button", { name: "Switch to browse mode" }),
    );
    expect(index()).toBe(1);
    expect(screen.getByText("Caption two")).toBeTruthy();
  });
  it("I-29 every supported keyboard key and on-screen control navigates", () => {
    for (const key of ["ArrowRight", " ", "PageDown"]) {
      const { unmount } = render(<Presentation steps={steps} title="Test" />);
      fireEvent.keyDown(window, { key });
      expect(index()).toBe(1);
      unmount();
    }
    for (const key of ["ArrowLeft", "PageUp"]) {
      const { unmount } = render(<Presentation steps={steps} title="Test" />);
      fireEvent.click(screen.getByRole("button", { name: "Next step" }));
      fireEvent.keyDown(window, { key });
      expect(index()).toBe(0);
      unmount();
    }
    render(<Presentation steps={steps} title="Test" />);
    fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(index()).toBe(0);
  });
  it("I-30 touch swipes qualify only when horizontal and sufficient", () => {
    expect(swipeDirection(-80, 0)).toBe(1);
    expect(swipeDirection(80, 0)).toBe(-1);
    expect(swipeDirection(40, 0)).toBe(0);
    expect(swipeDirection(80, 100)).toBe(0);
    render(<Presentation steps={steps} title="Test" />);
    const root = document.querySelector("[data-presentation-root]")!;
    fireEvent.touchStart(root, { touches: [{ clientX: 180, clientY: 40 }] });
    fireEvent.touchEnd(root, {
      changedTouches: [{ clientX: 70, clientY: 40 }],
    });
    expect(index()).toBe(1);
    fireEvent.touchStart(root, { touches: [{ clientX: 70, clientY: 40 }] });
    fireEvent.touchEnd(root, {
      changedTouches: [{ clientX: 180, clientY: 40 }],
    });
    expect(index()).toBe(0);
  });
  it("I-31 direct jumps and active semantics agree with first era step", () => {
    render(<Presentation steps={steps} title="Test" />);
    fireEvent.click(screen.getByRole("button", { name: "Step 3: three" }));
    expect(index()).toBe(2);
    expect(
      screen
        .getByRole("button", { name: "Step 3: three" })
        .getAttribute("aria-current"),
    ).toBe("step");
    expect(
      screen
        .getByRole("button", { name: "second" })
        .getAttribute("data-presentation-active"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "first" }));
    expect(index()).toBe(0);
    expect(
      screen
        .getByRole("button", { name: "Step 3: three" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });
  it("I-32 focused interactive and editable targets retain key defaults", () => {
    const { result } = renderHook(() => usePresentationNav(3));
    for (const tag of ["input", "textarea", "select", "button", "a"]) {
      const target = document.createElement(tag);
      document.body.append(target);
      for (const key of [
        "ArrowRight",
        " ",
        "PageDown",
        "ArrowLeft",
        "PageUp",
        "p",
      ]) {
        const e = new KeyboardEvent("keydown", {
          key,
          bubbles: true,
          cancelable: true,
        });
        target.dispatchEvent(e);
        expect(e.defaultPrevented).toBe(false);
        expect(result.current.index).toBe(0);
        expect(result.current.mode).toBe("browse");
      }
      target.remove();
    }
    for (const role of ["checkbox", "combobox", "link"]) {
      const target = document.createElement("div");
      target.setAttribute("role", role);
      document.body.append(target);
      fireEvent.keyDown(target, { key: "ArrowRight" });
      expect(result.current.index).toBe(0);
      target.remove();
    }
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    const child = document.createElement("span");
    editable.append(child);
    document.body.append(editable);
    fireEvent.keyDown(child, { key: "ArrowRight" });
    expect(result.current.index).toBe(0);
    editable.remove();
  });
  it("I-33 boundaries clamp across previous next direct and keyboard actions", () => {
    const { result } = renderHook(() => usePresentationNav(3));
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
    act(() => result.current.go(-100));
    expect(result.current.index).toBe(0);
    act(() => result.current.go(100));
    expect(result.current.index).toBe(2);
    act(() => result.current.next());
    expect(result.current.index).toBe(2);
    render(<Presentation steps={steps} title="Test" />);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(index()).toBe(0);
    for (let i = 0; i < 6; i++)
      fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(index()).toBe(2);
  });
  it("I-34 listeners are disposed through StrictMode remounts", () => {
    const add = vi.spyOn(window, "addEventListener"),
      remove = vi.spyOn(window, "removeEventListener");
    const { result, unmount } = renderHook(
      () => ({ nav: usePresentationNav(3), scale: useFitScale("browse") }),
      { wrapper: StrictMode },
    );
    act(() =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" })),
    );
    expect(result.current.nav.index).toBe(1);
    unmount();
    for (const event of ["keydown", "resize"]) {
      const added = add.mock.calls
        .filter((c) => c[0] === event)
        .map((c) => c[1]);
      const removed = remove.mock.calls
        .filter((c) => c[0] === event)
        .map((c) => c[1]);
      expect(removed).toEqual(added);
    }
  });
  it("I-35 fixed canvas fits wide narrow short and resize without step-driven scaling", () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380]);
    expect(fitScale(440, 190)).toBe(0.5);
    expect(fitScale(880, 380)).toBe(1);
    expect(fitScale(880, 190)).toBe(0.5);
    expect(fitScale(-10, 0)).toBe(0);
    const { result } = renderHook(() => useFitScale("browse"));
    act(() => {
      vi.stubGlobal("innerWidth", 440);
      vi.stubGlobal("innerHeight", 900);
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBeCloseTo((440 - 72) / 880);
    vi.unstubAllGlobals();
    render(<Presentation steps={steps} title="Test" />);
    const canvas = document.querySelector<HTMLElement>(
      "[data-presentation-canvas]",
    )!;
    const transform = canvas.style.transform;
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(canvas.style.transform).toBe(transform);
    expect(canvas.style.width).toBe("880px");
    expect(canvas.style.height).toBe("380px");
  });
});
