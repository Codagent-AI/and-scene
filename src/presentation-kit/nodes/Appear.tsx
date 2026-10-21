import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EXIT_T } from '../constants'

/**
 * Wraps newcomer entities: they fade in only after persisting entities have
 * moved (ENTER_DELAY >= LAYOUT_T), and fade out without waiting when departing.
 * Render it as a direct, keyed child of an `AnimatePresence`.
 */
export function Appear({ style, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      data-presentation-appear
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T } }}
      exit={{ opacity: 0, transition: { delay: 0, duration: EXIT_T } }}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
      {...rest}
    />
  )
}
