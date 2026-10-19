import { ENTER_DELAY, ENTER_T, EASE, EXIT_T } from '../constants'

/**
 * Motion props for a newcomer: fades in only after persisting entities have moved.
 * Continuing entities never remount, so `initial` does not run again for them.
 */
export const appearMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE } },
  exit: { opacity: 0, transition: { duration: EXIT_T, ease: EASE } },
} as const
