import { useEffect, useState } from "react";
import { DESIGN_W, DESIGN_H, MIN_SCALE, STAGE_LAYOUT } from "./constants";
import type { Mode } from "./types";
export const fitScale = (
  width: number,
  height: number,
  designW = DESIGN_W,
  designH = DESIGN_H,
) => Math.max(MIN_SCALE, Math.min(width / designW, height / designH));
export function useFitScale(mode: Mode) {
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  useEffect(() => {
    const resize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const layout = STAGE_LAYOUT[mode];
  return fitScale(
    viewport.width - layout.side * 2,
    viewport.height - layout.top - layout.bottom,
  );
}
