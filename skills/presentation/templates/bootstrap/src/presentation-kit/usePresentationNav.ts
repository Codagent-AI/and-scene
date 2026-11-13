import { useCallback, useEffect, useRef, useState } from "react";
import type { Mode } from "./types";
export const clampIndex = (index: number, count: number) =>
  Math.max(0, Math.min(Math.max(0, count - 1), index));
export function isInteractive(target: EventTarget | null) {
  return (
    target instanceof Element &&
    !!target.closest(
      'input,textarea,select,button,a,[contenteditable]:not([contenteditable="false"]),summary,audio[controls],video[controls],[tabindex]:not([tabindex="-1"]),[role="button"],[role="slider"],[role="textbox"],[role="checkbox"],[role="radio"],[role="combobox"],[role="link"],[role="switch"],[role="spinbutton"],[role="tab"],[role="menuitem"]',
    )
  );
}
export function swipeDirection(dx: number, dy: number) {
  return Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4
    ? dx < 0
      ? 1
      : -1
    : 0;
}
export function usePresentationNav(
  count: number,
  initialMode: Mode = "browse",
) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>(initialMode);
  const start = useRef<{ x: number; y: number } | null>(null);
  const go = useCallback(
    (n: number) => setIndex(clampIndex(n, count)),
    [count],
  );
  const move = useCallback(
    (delta: number) => setIndex((n) => clampIndex(n + delta, count)),
    [count],
  );
  const toggle = useCallback(
    () => setMode((m) => (m === "browse" ? "present" : "browse")),
    [],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isInteractive(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        move(1);
      }
      if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        move(-1);
      }
      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, toggle]);
  return {
    index: clampIndex(index, count),
    mode,
    go,
    next: () => move(1),
    prev: () => move(-1),
    toggle,
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      start.current = isInteractive(e.target)
        ? null
        : { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const t = e.changedTouches[0];
      if (start.current && t)
        move(
          swipeDirection(
            t.clientX - start.current.x,
            t.clientY - start.current.y,
          ),
        );
      start.current = null;
    },
  };
}
