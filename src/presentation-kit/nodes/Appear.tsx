import { AnimatePresence, motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export interface AppearProps extends HTMLMotionProps<'div'> {
  /** Mount/unmount switch so newcomers can also animate out. Defaults to true. */
  show?: boolean
  /** Seconds to wait so persisting entities settle first. */
  delay?: number
}

/**
 * Wraps NEWCOMER entities only. Entities that continue across steps must not be
 * wrapped: they morph through their layoutId instead of fading in again.
 */
export function Appear({ show = true, delay = ENTER_DELAY, transition, ...rest }: AppearProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          data-presentation-node="appear"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: ENTER_T, ease: EASE, delay } }}
          exit={{ opacity: 0, transition: { duration: ENTER_T * 0.6, ease: EASE } }}
          transition={transition}
          {...rest}
        />
      )}
    </AnimatePresence>
  )
}
