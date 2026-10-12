import { useCallback, useEffect, useRef, useState } from "react";
import type { PresentationMode } from "./types";
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    !!target.closest(
      'button,input,select,textarea,a,[contenteditable="true"],[role="button"]',
    )
  );
}
export function usePresentationNav(
  stepCount: number,
  initialMode: PresentationMode = "present",
) {
  const [stepIndex, setStepIndex] = useState(0);
  const [mode, setMode] = useState(initialMode);
  const jumpTo = useCallback(
    (index: number) =>
      setStepIndex(Math.max(0, Math.min(stepCount - 1, index))),
    [stepCount],
  );
  const next = useCallback(
    () => setStepIndex((i) => Math.min(stepCount - 1, i + 1)),
    [stepCount],
  );
  const prev = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);
  const toggleMode = useCallback(
    () => setMode((m) => (m === "present" ? "browse" : "present")),
    [],
  );
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isInteractiveTarget(e.target)) return;
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        next();
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        prev();
      } else if (e.key.toLowerCase() === "p") toggleMode();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [next, prev, toggleMode]);
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: import("react").TouchEvent) => {
    touchX.current = e.changedTouches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: import("react").TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0]!.clientX - touchX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchX.current = null;
  };
  return {
    stepIndex,
    mode,
    setMode,
    toggleMode,
    next,
    prev,
    jumpTo,
    onTouchStart,
    onTouchEnd,
  };
}
