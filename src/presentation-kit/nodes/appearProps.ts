import { EASE, ENTER_DELAY, ENTER_T } from '../constants.ts'

/** Entry animation for a newcomer: it fades in only once persisting entities have settled. */
export function appearProps(delay: number = ENTER_DELAY) {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: ENTER_T, delay, ease: EASE },
  }
}
