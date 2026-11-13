import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "../src/Router";
vi.mock("../src/presentations", () => ({
  presentations: [
    {
      slug: "first",
      title: "First",
      load: async () => ({ default: () => <p>First route</p> }),
    },
    {
      slug: "second",
      title: "Second",
      load: async () => ({ default: () => <p>Second route</p> }),
    },
  ],
}));
afterEach(cleanup);
it("I-8 landing enumerates multiple explicit entries and unknown paths return landing", () => {
  render(<Router pathname="/unknown" />);
  expect(screen.getByRole("link", { name: /First/ }).getAttribute("href")).toBe(
    "/first",
  );
  expect(
    screen.getByRole("link", { name: /Second/ }).getAttribute("href"),
  ).toBe("/second");
});
it("I-8 registry lazy-loads the matching presentation", async () => {
  render(<Router pathname="/second" />);
  expect(await screen.findByText("Second route")).toBeTruthy();
});
