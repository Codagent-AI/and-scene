import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'

// Shared enter/exit/layout timing: newcomers fade in after continuing entities finish their layout move.
export const entityMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { opacity: { duration: ENTER_T, delay: ENTER_DELAY }, layout: { duration: LAYOUT_T } },
} as const
