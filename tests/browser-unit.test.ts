// @vitest-environment node
import { EventEmitter } from "node:events";
import { afterEach, expect, it, vi } from "vitest";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { withBrowser, visitSteps } from "../scripts/browser.mjs";
vi.mock("node:child_process", () => ({ spawn: vi.fn() }));
vi.mock("playwright", () => ({ chromium: { launch: vi.fn() } }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
it.each(["launch", "newPage", "run", "close", "success"])(
  "I-37 preview cleanup survives %s lifecycle outcome",
  async (fault) => {
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      exitCode: null,
      signalCode: null,
      kill: vi.fn(),
    });
    child.kill.mockImplementation(() => {
      setTimeout(() => child.emit("exit", 0), 10);
      return true;
    });
    vi.mocked(spawn).mockReturnValue(
      child as unknown as ReturnType<typeof spawn>,
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const browser = {
      newPage: vi.fn().mockResolvedValue({}),
      close: vi.fn().mockResolvedValue(undefined),
    };
    if (fault === "launch")
      vi.mocked(chromium.launch).mockRejectedValue(new Error("launch failure"));
    else
      vi.mocked(chromium.launch).mockResolvedValue(
        browser as unknown as Awaited<ReturnType<typeof chromium.launch>>,
      );
    if (fault === "newPage")
      browser.newPage.mockRejectedValue(new Error("newPage failure"));
    if (fault === "close")
      browser.close.mockRejectedValue(new Error("close failure"));
    const run = vi.fn(async () => {
      if (fault === "run") throw new Error("run failure");
      return "done";
    });
    const result = withBrowser(run);
    if (fault === "success") expect(await result).toBe("done");
    else await expect(result).rejects.toThrow(`${fault} failure`);
    expect(child.kill).toHaveBeenCalledExactlyOnceWith("SIGTERM");
    expect(child.listenerCount("exit")).toBe(0);
    if (fault !== "launch") expect(browser.close).toHaveBeenCalledOnce();
    if (fault === "launch" || fault === "newPage")
      expect(run).not.toHaveBeenCalled();
  },
);
it("I-38 configured settle waits precede every capture including the first step", async () => {
  const calls: string[] = [];
  const page = {
    on: vi.fn(),
    goto: vi.fn(),
    locator: () => ({ waitFor: vi.fn(), getAttribute: async () => "2" }),
    waitForFunction: async () => {
      calls.push("index");
    },
    waitForTimeout: async (ms: number) => {
      calls.push(`settle:${ms}`);
    },
    evaluate: async () => ({ title: "t", caption: "c", era: "e" }),
    keyboard: {
      press: async () => {
        calls.push("advance");
      },
    },
  };
  await visitSteps(page, "http://127.0.0.1", "fixture", {
    settle: 123,
    onStep: async (i: number) => {
      calls.push(`capture:${i}`);
    },
  });
  expect(calls).toEqual([
    "index",
    "settle:123",
    "capture:0",
    "advance",
    "index",
    "settle:123",
    "capture:1",
  ]);
});
