import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EASE } from '../constants'

/** Wraps a newcomer built from raw elements so it enters after persisting entities settle. */
export function Appear({ children }: { children: ReactNode }) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T / 2 } }}
      style={{ position: 'absolute', inset: 0 }}
    >
      {children}
    </motion.div>
  )
}
