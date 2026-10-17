import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T, EXIT_T } from '../constants.ts'

/**
 * Wrap entities that are new in a step. They fade in only after persisting
 * entities have finished moving. Once mounted, the wrapper never animates
 * again, so continuing entities are not treated as newcomers.
 */
export function Appear({ children }: { children: ReactNode }) {
  return (
    <motion.div
      data-presentation-appear
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {children}
    </motion.div>
  )
}
