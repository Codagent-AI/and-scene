import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T, EXIT_T } from '../constants'

/**
 * Fades newcomers in after persisting entities have moved, and out when they
 * leave. Wrap only entities that first appear in a step; continuing entities
 * morph via their `layoutId` and must not be wrapped.
 */
export function Appear({ children, delay = ENTER_DELAY }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {children}
    </motion.div>
  )
}
