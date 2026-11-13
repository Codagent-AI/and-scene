import { useEffect, useState, useCallback } from "react";
import type { Mode } from "./types";
export function usePresentationNav(
  count: number,
  initialMode: Mode = "browse",
) {
  const [position, setPosition] = useState(0);
  const [mode, setMode] = useState<Mode>(initialMode);
  const clamp = useCallback(
    (n: number) => Math.max(0, Math.min(Math.max(0, count - 1), n)),
    [count],
  );
  const index = clamp(position);
  const go = useCallback((n: number) => setPosition(clamp(n)), [clamp]);
  const next = useCallback(() => setPosition((n) => clamp(n + 1)), [clamp]);
  const prev = useCallback(() => setPosition((n) => clamp(n - 1)), [clamp]);
  const toggle = useCallback(
    () => setMode((m) => (m === "browse" ? "present" : "browse")),
    [],
  );
  useEffect(() => {
    let start: { x: number; y: number } | undefined;
    const interactive = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest(
        'button,a,input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="slider"],[role="application"],[role="toolbar"],[role="grid"],[role="treegrid"],[role="tree"],[role="listbox"],[role="menu"],[role="menubar"],[role="tablist"],[role="radiogroup"],[role="spinbutton"],[role="combobox"],[role="textbox"],[role="searchbox"],[role="scrollbar"],[role="tab"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"],[role="option"],[role="radio"],[role="switch"],[role="checkbox"],[role="treeitem"],[role="gridcell"],[role="row"]',
      );
    const key = (e: KeyboardEvent) => {
      if (interactive(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        next();
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        prev();
      } else if (e.key.toLowerCase() === "p") toggle();
    };
    const begin = (e: TouchEvent) => {
      if (interactive(e.target)) return;
      const t = e.touches[0];
      if (t) start = { x: t.clientX, y: t.clientY };
    };
    const end = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (start && t) {
        const dx = t.clientX - start.x,
          dy = t.clientY - start.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          if (dx < 0) next();
          else prev();
        }
      }
      start = undefined;
    };
    const cancel = () => {
      start = undefined;
    };
    window.addEventListener("keydown", key);
    window.addEventListener("touchstart", begin, { passive: true });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", cancel);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("touchstart", begin);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", cancel);
    };
  }, [next, prev, toggle]);
  return { index, mode, go, next, prev, toggle };
}
