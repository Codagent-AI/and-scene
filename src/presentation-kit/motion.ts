import { ENTER_DELAY, ENTER_T, EASE, EXIT_T, LAYOUT_T } from './constants'

export const LAYOUT_TRANSITION = { layout: { duration: LAYOUT_T, ease: EASE } }

/** Newcomer enter timing; caller offsets can only delay, never advance. */
export function appearTransition(offset = 0) {
  return { duration: ENTER_T, delay: ENTER_DELAY + Math.max(0, offset), ease: EASE }
}

export const EXIT_TRANSITION = { duration: EXIT_T }
