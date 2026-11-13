import { Children } from "react";
import type { ReactNode } from "react";
import { render, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  ENTER_DELAY,
  ENTER_T,
  LAYOUT_T,
} from "../src/presentation-kit/constants";
const observed = vi.hoisted(() => new Map<string, Record<string, unknown>>());
vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  return {
    motion: {
      div: (props: Record<string, unknown> & { children?: ReactNode }) => {
        observed.set(String(props.layoutId || props["data-probe"]), props);
        return createElement(
          "div",
          { "data-testid": props.layoutId || props["data-probe"] },
          props.children,
        );
      },
    },
  };
});
import { Box } from "../src/presentation-kit/nodes/Box";
import { Appear } from "../src/presentation-kit/nodes/Appear";
afterEach(() => {
  cleanup();
  observed.clear();
});
it("I-20 configures stable layout morphs, delayed entrants and immediate departure animation", () => {
  const { rerender } = render(
    <Appear data-probe="newcomer">
      <Box id="stable" style={{ left: 0, width: 40 }}>
        old
      </Box>
    </Appear>,
  );
  expect(observed.get("stable")).toMatchObject({
    layout: true,
    layoutId: "stable",
    transition: { layout: { duration: LAYOUT_T } },
  });
  expect(observed.get("stable")).not.toHaveProperty("initial");
  expect(observed.get("newcomer")).toMatchObject({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0, transition: { delay: 0, duration: ENTER_T } },
    transition: { delay: ENTER_DELAY, duration: ENTER_T },
  });
  expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T);
  rerender(
    <Appear data-probe="newcomer">
      <Box id="stable" style={{ left: 80, width: 90 }}>
        new label
      </Box>
    </Appear>,
  );
  expect(observed.get("stable")).toMatchObject({
    layoutId: "stable",
    style: { left: 80, width: 90 },
  });
  expect(
    Children.toArray(observed.get("stable")!.children as ReactNode),
  ).toEqual(["new label"]);
});
