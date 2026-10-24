import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T, EASE } from '../constants.ts'

interface AppearProps {
  children: ReactNode
  /** Extra seconds after persisting entities have settled. */
  delay?: number
}

/**
 * Wraps a newcomer so it fades in only after persisting entities have moved.
 * Never wrap an entity that continues across steps.
 */
export function Appear({ children, delay = 0 }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, ease: EASE, delay: ENTER_DELAY + delay } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T, ease: EASE } }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {children}
    </motion.div>
  )
}
