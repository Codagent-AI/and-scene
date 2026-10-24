import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

/** Motion props for a newcomer: it fades in only after persisting entities have moved. */
export const appearMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY, ease: EASE } },
  exit: { opacity: 0, transition: { duration: ENTER_T / 2 } },
}
