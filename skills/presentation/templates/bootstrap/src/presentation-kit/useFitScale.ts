import { useEffect, useState } from "react";
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from "./constants";
import type { PresentationMode } from "./types";

export function computeFitScale(
  width: number,
  height: number,
  mode: PresentationMode,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
): number {
  const layout = STAGE_LAYOUT[mode];
  return Math.max(
    MIN_SCALE,
    Math.min(
      (width - layout.horizontal * 2) / designWidth,
      (height - layout.header - layout.footer - layout.vertical * 2) /
        designHeight,
    ),
  );
}
export function useFitScale(
  mode: PresentationMode,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
): number {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return computeFitScale(
    size.width,
    size.height,
    mode,
    designWidth,
    designHeight,
  );
}
