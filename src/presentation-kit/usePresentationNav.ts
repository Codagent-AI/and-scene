import { useEffect, useState, useRef } from "react";
import type { TouchEvent } from "react";
import type { Mode } from "./types";
export const clamp = (index: number, count: number) =>
  Math.max(0, Math.min(count - 1, index));
export function keyAction(key: string) {
  if (["ArrowRight", " ", "PageDown"].includes(key)) return 1;
  if (["ArrowLeft", "PageUp"].includes(key)) return -1;
  return 0;
}
export function usePresentationNav(
  count: number,
  initialMode: Mode = "browse",
) {
  const [position, setIndex] = useState(0);
  const index = clamp(position, count);
  const [mode, setMode] = useState<Mode>(initialMode);
  const start = useRef<{ x: number; y: number } | null>(null);
  const go = (i: number) => setIndex(clamp(i, count));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        (e.target instanceof Element &&
          e.target.closest(
            'button,a,input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"],[role="combobox"],[role="listbox"],[role="tab"],[role="menuitem"],[role="checkbox"],[role="radio"],[role="switch"],[role="spinbutton"]',
          ))
      )
        return;
      const delta = keyAction(e.key);
      if (delta) {
        e.preventDefault();
        setIndex((i) => clamp(i + delta, count));
      }
      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        setMode((m) => (m === "browse" ? "present" : "browse"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);
  return {
    index,
    mode,
    go,
    next: () => go(index + 1),
    prev: () => go(index - 1),
    toggle: () => setMode((m) => (m === "browse" ? "present" : "browse")),
    onTouchStart: (e: TouchEvent) => {
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.changedTouches[0].clientX - s.x;
      const dy = e.changedTouches[0].clientY - s.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy))
        go(index + (dx < 0 ? 1 : -1));
    },
  };
}
