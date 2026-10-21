import { ENTER_DELAY, ENTER_T, EASE } from '../constants'

/** Fade-in for a newcomer, delayed until persisting entities have settled. */
export const enterProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY, ease: EASE } },
  exit: { opacity: 0, transition: { duration: ENTER_T / 2 } },
} as const

/** Exit-only behavior for entities that persist; they never replay an entrance. */
export const exitProps = {
  exit: { opacity: 0, transition: { duration: ENTER_T / 2 } },
} as const
