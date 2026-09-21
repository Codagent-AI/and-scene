import { ENTER_DELAY, ENTER_T, EASE, LAYOUT_T } from './constants'

export const sceneMotion = {
  layout: true,
  transition: { layout: { duration: LAYOUT_T, ease: EASE } },
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY } },
  exit: { opacity: 0 },
}
