import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'

/**
 * Entry animation for one node. A newcomer starts hidden and fades in after persisting entities
 * settle. A continuing node starts visible, so it never plays an entry. Both forms keep the same
 * element and key, so a node is never remounted when it changes from newcomer to continuing.
 */
export function entryMotion(entering: boolean) {
  if (!entering) {
    return { initial: false as const, transition: { duration: LAYOUT_T, ease: EASE } }
  }
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE },
  }
}

/** Exit that fades a departing node out without the entry delay. */
export const EXIT_MOTION = { opacity: 0, transition: { delay: 0, duration: LAYOUT_T, ease: EASE } } as const
