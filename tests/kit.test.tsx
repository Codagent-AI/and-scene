import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  renderHook,
  act,
} from "@testing-library/react";
import { useState } from "react";
import { Presentation } from "../src/presentation-kit/Presentation";
import { fitScale } from "../src/presentation-kit/useFitScale";
import type { Step, SceneProps } from "../src/presentation-kit/types";
import { Box } from "../src/presentation-kit/nodes/Box";
import { ENTER_DELAY, LAYOUT_T } from "../src/presentation-kit/constants";
import { usePresentationNav } from "../src/presentation-kit/usePresentationNav";
import { useFitScale } from "../src/presentation-kit/useFitScale";
function OtherScene({ payload }: SceneProps<{ text: string }>) {
  const [instance] = useState(Math.random);
  return <div data-other-instance={instance}>other:{payload.text}</div>;
}
function Scene({ payload }: SceneProps<{ text: string }>) {
  const [instance] = useState(Math.random);
  return (
    <Box id="stable" data-instance={instance}>
      {payload.text}
    </Box>
  );
}
const steps: Step<{ text: string }>[] = ["a", "b", "c"].map((id, i) => ({
  id,
  era: i < 2 ? "first" : "last",
  title: id,
  caption: `Caption ${id}`,
  Scene,
  groupKey: "shared",
  payload: { text: id },
}));
afterEach(cleanup);
const host = () => document.querySelector("[data-step-index]")!;
const index = () => Number(host().getAttribute("data-step-index"));
describe("scene contracts", () => {
  it("I-13 ordered metadata and numbering", () => {
    const { rerender } = render(
      <Presentation steps={[steps[2], steps[0]]} title="Test" />,
    );
    const assertStep = (
      number: string,
      total: string,
      era: string,
      text: string,
    ) => {
      expect(
        document.querySelector("[data-presentation-marker]")?.textContent,
      ).toBe(`${number} / ${total} · ${era}`);
      expect(
        document.querySelector("[data-presentation-step-title]")?.textContent,
      ).toBe(text);
      expect(screen.getByText(`Caption ${text}`)).toBeTruthy();
      expect(document.querySelector("[data-instance]")?.textContent).toBe(text);
    };
    assertStep("01", "02", "last", "c");
    fireEvent.click(screen.getByLabelText("Next step"));
    assertStep("02", "02", "first", "a");
    const inserted = {
      ...steps[0],
      id: "inserted",
      era: "added",
      title: "inserted",
      caption: "Caption inserted",
      payload: { text: "inserted" },
    };
    rerender(
      <Presentation steps={[steps[2], inserted, steps[0]]} title="Test" />,
    );
    assertStep("02", "03", "added", "inserted");
    fireEvent.click(screen.getByLabelText("Next step"));
    assertStep("03", "03", "first", "a");
    rerender(<Presentation steps={[steps[2], steps[0]]} title="Test" />);
    assertStep("02", "02", "first", "a");
  });
  it("I-16 grouped scene persists and changed identity remounts", () => {
    const { rerender } = render(<Presentation steps={steps} title="Test" />);
    const scene = () =>
      [...document.querySelectorAll("[data-instance]")].at(-1)!;
    const before = scene().getAttribute("data-instance");
    expect(scene().textContent).toBe("a");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(scene().getAttribute("data-instance")).toBe(before);
    expect(scene().textContent).toBe("b");
    const changed = steps.map((s) => ({ ...s, groupKey: "changed" }));
    rerender(<Presentation steps={changed} title="Test" />);
    expect(scene().getAttribute("data-instance")).not.toBe(before);
    expect(scene().textContent).toBe("b");
    rerender(
      <Presentation
        steps={changed.map((s) => ({ ...s, Scene: OtherScene }))}
        title="Test"
      />,
    );
    expect(document.querySelector("[data-other-instance]")?.textContent).toBe(
      "other:b",
    );
    expect(
      document
        .querySelector("[data-other-instance]")
        ?.getAttribute("data-other-instance"),
    ).not.toBe(before);
  });
  it("I-18 primitive forwards hooks and identity", () => {
    render(
      <Box id="box" className="custom" style={{ left: 42 }} data-custom="yes">
        Node
      </Box>,
    );
    const el = screen.getByText("Node");
    expect(el.getAttribute("data-presentation-node")).toBe("box");
    expect(el.className).toContain("custom");
    expect(el.style.left).toBe("42px");
  });
  it("I-15 newcomer timing follows layout duration", () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T.duration);
  });
  it("I-19 default attribution and opt-in brand", () => {
    const { rerender } = render(<Presentation steps={steps} title="Test" />);
    const a = screen.getByText("made by and-scene");
    expect(a.getAttribute("href")).toBe(
      "https://github.com/Codagent-AI/and-scene",
    );
    expect(a.hasAttribute("data-presentation-attribution")).toBe(true);
    expect(
      document.querySelector("[data-presentation-brand]")?.textContent,
    ).toBe("");
    rerender(
      <Presentation steps={steps} title="Test" brand={<a href="/">Host</a>} />,
    );
    expect(screen.getByText("Host")).toBeTruthy();
  });
  it("I-20 modes and I-21 position preservation", () => {
    render(<Presentation steps={steps} title="Test" initialMode="present" />);
    expect(screen.queryByText("Caption a")).toBeNull();
    expect(screen.queryByLabelText("Next step")).toBeNull();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "p" });
    expect(index()).toBe(1);
    expect(screen.getByText("Caption b")).toBeTruthy();
    expect(screen.getByLabelText("Next step")).toBeTruthy();
  });
  it("I-22 keyboard navigation and focused controls", () => {
    render(<Presentation steps={steps} title="Test" />);
    for (const key of ["ArrowRight", " ", "PageDown"]) {
      fireEvent.keyDown(window, { key });
      expect(index()).toBeGreaterThan(0);
      fireEvent.keyDown(window, { key: "ArrowLeft" });
    }
    fireEvent.keyDown(window, { key: "PageDown" });
    fireEvent.keyDown(window, { key: "PageUp" });
    expect(index()).toBe(0);
    for (const tag of ["button", "a", "input", "select", "textarea", "div"]) {
      const el = document.createElement(tag);
      if (tag === "div") el.setAttribute("contenteditable", "true");
      document.body.append(el);
      fireEvent.keyDown(el, { key: "ArrowRight" });
      expect(index()).toBe(0);
      el.remove();
    }
  });
  it("keeps arrow keys for focused composite ARIA widgets", () => {
    render(<Presentation steps={steps} title="Test" />);
    for (const role of [
      "grid",
      "listbox",
      "tablist",
      "menu",
      "tree",
      "radiogroup",
      "application",
      "toolbar",
    ]) {
      const el = document.createElement("div");
      el.setAttribute("role", role);
      el.tabIndex = 0;
      document.body.append(el);
      fireEvent.keyDown(el, { key: "ArrowRight" });
      expect(index()).toBe(0);
      el.remove();
    }
  });
  it("I-23 touch direction thresholds and cleanup", () => {
    const { unmount } = render(<Presentation steps={steps} title="Test" />);
    const swipe = (x: number, y = 0) => {
      fireEvent.touchStart(window, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      fireEvent.touchEnd(window, {
        changedTouches: [{ clientX: 200 + x, clientY: 100 + y }],
      });
    };
    swipe(-90);
    expect(index()).toBe(1);
    swipe(90);
    expect(index()).toBe(0);
    swipe(-10);
    swipe(-90, 200);
    expect(index()).toBe(0);
    unmount();
    fireEvent.keyDown(window, { key: "ArrowRight" });
  });
  it("I-24 direct jumps and I-25 active semantics", () => {
    render(<Presentation steps={steps} title="Test" />);
    fireEvent.click(screen.getByLabelText("Go to step 2"));
    expect(index()).toBe(1);
    expect(
      screen.getByLabelText("Go to step 2").getAttribute("aria-current"),
    ).toBe("step");
    fireEvent.click(screen.getByRole("button", { name: "last" }));
    expect(index()).toBe(2);
    expect(
      screen
        .getByRole("button", { name: "last" })
        .getAttribute("data-presentation-active"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "first" }));
    expect(index()).toBe(0);
  });
  it("I-26 boundaries clamp without wrapping", () => {
    render(<Presentation steps={steps} title="Test" />);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(index()).toBe(0);
    for (let i = 0; i < 6; i++)
      fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(index()).toBe(2);
    fireEvent.click(screen.getByLabelText("Next step"));
    expect(index()).toBe(2);
  });
  it("I-27 uniform fit uses fixed dimensions and mode geometry", () => {
    expect(fitScale(880, 380)).toBe(1);
    expect(fitScale(440, 380)).toBe(0.5);
    expect(fitScale(880, 190)).toBe(0.5);
    expect(fitScale(220, 95)).toBe(0.25);
    expect(fitScale(0, 0)).toBeGreaterThan(0);
  });
});
it("I-22 empty contenteditable retains keyboard behavior", () => {
  render(<Presentation steps={steps} title="Test" />);
  const el = document.createElement("div");
  el.setAttribute("contenteditable", "");
  document.body.append(el);
  fireEvent.keyDown(el, { key: "ArrowRight" });
  expect(index()).toBe(0);
  el.remove();
});
it("I-27 resize changes a uniform transform and mode geometry without step reflow", () => {
  Object.defineProperty(window, "innerWidth", { value: 1000, writable: true });
  Object.defineProperty(window, "innerHeight", { value: 800, writable: true });
  render(<Presentation steps={steps} title="Test" />);
  const canvas = () =>
    document.querySelector<HTMLElement>("[data-presentation-canvas]")!;
  const before = canvas().style.transform;
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(canvas().style.transform).toBe(before);
  window.innerWidth = 500;
  fireEvent(window, new Event("resize"));
  expect(canvas().style.transform).not.toBe(before);
  expect(canvas().style.width).toBe("880px");
  expect(canvas().style.height).toBe("380px");
  // centered from the stage midpoint so a canvas wider than the viewport is not pushed off-screen
  expect(canvas().style.position).toBe("absolute");
  expect(canvas().style.left).toBe("50%");
  expect(canvas().style.top).toBe("50%");
  expect(canvas().style.transform).toMatch(/^translate\(-50%, -50%\) scale\(/);
  const browse = document.querySelector<HTMLElement>(
    "[data-presentation-stage]",
  )!.style.inset;
  fireEvent.keyDown(window, { key: "p" });
  expect(
    document.querySelector<HTMLElement>("[data-presentation-stage]")!.style
      .inset,
  ).not.toBe(browse);
});
it("I-20 ToC is only present at wide viewport sizes even without presentation CSS", () => {
  window.innerWidth = 500;
  render(<Presentation steps={steps} title="Test" />);
  expect(screen.queryByRole("navigation", { name: "Sections" })).toBeNull();
  window.innerWidth = 1200;
  fireEvent(window, new Event("resize"));
  expect(screen.getByRole("navigation", { name: "Sections" })).toBeTruthy();
});

it("I-22 I-23 keyboard and every touch listener are removed with their original callbacks", () => {
  const add = vi.spyOn(window, "addEventListener"),
    remove = vi.spyOn(window, "removeEventListener");
  const { unmount } = renderHook(() => usePresentationNav(3));
  const registrations = add.mock.calls.filter(([type]) =>
    ["keydown", "touchstart", "touchend", "touchcancel"].includes(type),
  );
  expect(registrations.map(([type]) => type).sort()).toEqual([
    "keydown",
    "touchcancel",
    "touchend",
    "touchstart",
  ]);
  unmount();
  for (const [type, callback] of registrations)
    expect(remove).toHaveBeenCalledWith(type, callback);
  add.mockRestore();
  remove.mockRestore();
});
it("I-27 resize subscription removes its original listener on unmount", () => {
  const add = vi.spyOn(window, "addEventListener"),
    remove = vi.spyOn(window, "removeEventListener");
  const { unmount } = renderHook(() => useFitScale("browse"));
  const registrations = add.mock.calls.filter(([type]) => type === "resize");
  expect(registrations).toHaveLength(1);
  unmount();
  expect(remove).toHaveBeenCalledWith("resize", registrations[0][1]);
  add.mockRestore();
  remove.mockRestore();
});
it("I-26 swipe and out-of-range direct navigation clamp at both boundaries", () => {
  const { result } = renderHook(() => usePresentationNav(3));
  const swipe = (dx: number) => {
    fireEvent.touchStart(window, { touches: [{ clientX: 200, clientY: 0 }] });
    fireEvent.touchEnd(window, {
      changedTouches: [{ clientX: 200 + dx, clientY: 0 }],
    });
  };
  act(() => result.current.go(-99));
  expect(result.current.index).toBe(0);
  swipe(90);
  expect(result.current.index).toBe(0);
  act(() => result.current.go(99));
  expect(result.current.index).toBe(2);
  swipe(-90);
  expect(result.current.index).toBe(2);
  act(() => result.current.go(1));
  expect(result.current.index).toBe(1);
  act(() => result.current.prev());
  act(() => result.current.prev());
  expect(result.current.index).toBe(0);
  act(() => result.current.next());
  act(() => result.current.next());
  act(() => result.current.next());
  expect(result.current.index).toBe(2);
});
