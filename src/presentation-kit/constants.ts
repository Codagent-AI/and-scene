export const DESIGN_W = 880;
export const DESIGN_H = 380;
export const MIN_SCALE = 0;
export const EASE = [0.22, 1, 0.36, 1] as const;
export const LAYOUT_T = 0.45;
export const ENTER_T = 0.25;
export const ENTER_DELAY = LAYOUT_T;
export const SETTLE_MS = 800;
export const STAGE_LAYOUT = {
  browse: { top: 100, bottom: 220, side: 32 },
  present: { top: 60, bottom: 100, side: 24 },
};
export const entityMotion = {
  layout: true,
  transition: { layout: { duration: LAYOUT_T, ease: EASE } },
  exit: { opacity: 0, transition: { duration: ENTER_T } },
} as const;
export const newcomerMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: ENTER_T, delay: ENTER_DELAY },
};
