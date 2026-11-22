import { useEffect, useState } from "react";
import { DESIGN_W, DESIGN_H, STAGE_LAYOUT } from "./constants";
import type { Mode } from "./types";
export function fitScale(width: number, height: number, mode: Mode) {
  const g = STAGE_LAYOUT[mode];
  return Math.max(
    0,
    Math.min(
      (width - g.side * 2) / DESIGN_W,
      (height - g.top - g.bottom) / DESIGN_H,
      1,
    ),
  );
}
export function useViewport() {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  useEffect(() => {
    const resize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return size;
}

export function useFitScale(mode: Mode) {
  const size = useViewport();
  return fitScale(size.width, size.height, mode);
}
