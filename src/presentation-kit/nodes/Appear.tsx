import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

/**
 * Fades in a newcomer after persisting entities have moved. Wrap only entities
 * that are new in this step; continuing entities must not be wrapped.
 */
export function Appear({ children }: { children?: ReactNode }) {
  return (
    <motion.div
      data-presentation-appear=""
      style={{ position: 'absolute', inset: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: ENTER_DELAY, duration: ENTER_T, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
