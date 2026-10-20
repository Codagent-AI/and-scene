import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants.ts'

export interface AppearProps extends HTMLMotionProps<'div'> {
  /** Seconds to wait before fading in; defaults to waiting for persisting layout motion. */
  delay?: number
}

/**
 * Wraps a newcomer so it fades in after persisting entities have moved, and
 * fades out when removed. Continuing entities must not be wrapped in it.
 */
export function Appear({ delay = ENTER_DELAY, transition, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: ENTER_T, ease: EASE } }}
      transition={transition ?? { duration: ENTER_T, delay, ease: EASE }}
      {...rest}
    />
  )
}
