import { Suspense, lazy } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Landing } from "../src/Landing";
import { presentations, resolvePresentation } from "../src/presentations";
afterEach(cleanup);
it("I-10 explicit registry preserves multiple entries landing links and lazy route loading", async () => {
  const existing = [...presentations];
  const load = vi.fn(async () => ({ default: () => <p>Second scene</p> }));
  try {
    presentations.push({ slug: "second", title: "Second", load });
    render(<Landing />);
    expect(
      screen.getByRole("link", { name: "Second ↗" }).getAttribute("href"),
    ).toBe("/second");
    expect(resolvePresentation("/how-to-make-a-presentation")).toBe(
      existing[0],
    );
    expect(load).not.toHaveBeenCalled();
    cleanup();
    const Talk = lazy(resolvePresentation("/second")!.load);
    render(
      <Suspense fallback="loading">
        <Talk />
      </Suspense>,
    );
    expect(await screen.findByText("Second scene")).toBeTruthy();
    expect(load).toHaveBeenCalledTimes(1);
  } finally {
    presentations.splice(0, presentations.length, ...existing);
  }
});
it("I-11 root and unknown routes select landing fallback without loading entries", () => {
  expect(resolvePresentation("/")).toBeUndefined();
  expect(resolvePresentation("/missing")).toBeUndefined();
  expect(resolvePresentation("/nested/path")).toBeUndefined();
});
