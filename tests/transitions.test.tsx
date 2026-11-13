import { useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { render, cleanup, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Box } from "../src/presentation-kit/nodes/Box";
import { Appear } from "../src/presentation-kit/nodes/Appear";
import { Stage } from "../src/presentation-kit/Stage";
import type { Step } from "../src/presentation-kit/types";
afterEach(cleanup);
function Entities({ beat }: { beat: number }) {
  const entities =
    beat === 0 ? ["continuing", "departing"] : ["continuing", "entering"];
  return (
    <AnimatePresence>
      {entities.map((id) => (
        <Appear key={id} data-testid={`appear-${id}`}>
          <Box id={id} style={{ left: beat * 80, width: 40 + beat * 40 }}>
            {id === "continuing" ? `label ${beat}` : id}
          </Box>
        </Appear>
      ))}
    </AnimatePresence>
  );
}
it("I-20 actually introduces and removes entities without fading the continuing instance again", async () => {
  const { rerender, getByTestId, queryByText } = render(<Entities beat={0} />);
  await waitFor(
    () => expect(getByTestId("appear-continuing").style.opacity).toBe("1"),
    { timeout: 3000 },
  );
  const continuing = document.querySelector(
    '[data-presentation-entity="continuing"]',
  )!;
  const wrapper = getByTestId("appear-continuing");
  rerender(<Entities beat={1} />);
  expect(
    document.querySelector('[data-presentation-entity="continuing"]'),
  ).toBe(continuing);
  expect(getByTestId("appear-continuing")).toBe(wrapper);
  expect(wrapper.style.opacity).toBe("1");
  expect(continuing.textContent).toBe("label 1");
  expect(getByTestId("appear-entering").style.opacity).toBe("0");
  expect(queryByText("departing")).toBeTruthy();
  await waitFor(() => expect(queryByText("departing")).toBeNull(), {
    timeout: 3000,
  });
  await waitFor(
    () => expect(getByTestId("appear-entering").style.opacity).toBe("1"),
    { timeout: 3000 },
  );
  expect(wrapper.style.opacity).toBe("1");
});
for (const change of [
  "same group",
  "different group",
  "different component",
] as const) {
  it(`I-21 ${change} has the required real mount and exit lifecycle`, async () => {
    const events: string[] = [];
    function A({ payload }: { payload: string }) {
      useEffect(() => {
        events.push("mount A");
        return () => {
          events.push("unmount A");
        };
      }, []);
      return <div>{payload}</div>;
    }
    function B({ payload }: { payload: string }) {
      useEffect(() => {
        events.push("mount B");
        return () => {
          events.push("unmount B");
        };
      }, []);
      return <div>{payload}</div>;
    }
    const steps: Step<string>[] = [
      {
        id: "one",
        era: "e",
        title: "one",
        caption: "c",
        payload: "state one",
        Scene: A,
        groupKey: "shared",
      },
      {
        id: "two",
        era: "e",
        title: "two",
        caption: "c",
        payload: "state two",
        Scene: change === "different component" ? B : A,
        groupKey: change === "different group" ? "other" : "shared",
      },
    ];
    const { rerender, getByText, queryByText } = render(
      <Stage steps={steps} index={0} mode="browse" />,
    );
    const host = document.querySelector("[data-presentation-scene]");
    rerender(<Stage steps={steps} index={1} mode="browse" />);
    expect(getByText("state two")).toBeTruthy();
    if (change === "same group") {
      expect(events).toEqual(["mount A"]);
      expect(queryByText("state one")).toBeNull();
      expect(document.querySelector("[data-presentation-scene]")).toBe(host);
    } else {
      expect(events).toEqual([
        "mount A",
        change === "different component" ? "mount B" : "mount A",
      ]);
      expect(queryByText("state one")).toBeTruthy();
      await waitFor(() => expect(queryByText("state one")).toBeNull(), {
        timeout: 3000,
      });
      expect(events).toContain("unmount A");
      expect(document.querySelector("[data-presentation-scene]")).not.toBe(
        host,
      );
    }
  });
}
