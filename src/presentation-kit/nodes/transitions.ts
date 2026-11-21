import { EASE, ENTER_DELAY, ENTER_T, EXIT_T, LAYOUT_T } from '../constants'
import type { HTMLMotionProps } from 'motion/react'

export const entityTransition = { layout: { duration: LAYOUT_T, ease: EASE } }

export const appearMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE } },
  exit: { opacity: 0, transition: { duration: EXIT_T, ease: EASE } },
} satisfies Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit'>
