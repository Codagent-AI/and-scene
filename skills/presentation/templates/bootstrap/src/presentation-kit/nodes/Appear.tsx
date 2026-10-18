import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export type AppearProps = Omit<HTMLMotionProps<'div'>, 'ref'> & {
  /** Seconds to wait; defaults to ENTER_DELAY so persisting entities finish moving first. */
  delay?: number
}

/**
 * Wraps newcomer entities only. It fills the scene layer so absolutely positioned children keep
 * their coordinates, and fades in after continuing entities have settled.
 */
export function Appear({ delay = ENTER_DELAY, style, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T * 0.6 } }}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
      {...rest}
    />
  )
}
