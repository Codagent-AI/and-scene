import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants.ts'

export interface AppearProps {
  children: ReactNode
  /** Seconds to wait before entering; defaults to the time persisting entities need to settle. */
  delay?: number
}

/**
 * Newcomer wrapper: fades in after persisting entities have moved and fades out on exit.
 * Keep it mounted for the entity's whole lifetime; entrance runs only on mount, so
 * continuing entities are never re-faded.
 */
export function Appear({ children, delay = ENTER_DELAY }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T / 2 } }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {children}
    </motion.div>
  )
}
