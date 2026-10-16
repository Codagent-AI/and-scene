import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants'

export interface AppearProps {
  children: ReactNode
  /** Seconds to wait; defaults to waiting for persisting entities to settle. */
  delay?: number
}

/**
 * Wraps newcomer entities: they fade in only after persisting entities have
 * finished morphing, and fade out when they depart. Continuing entities should
 * not be wrapped again; keep the same element in place so it morphs instead.
 */
export function Appear({ children, delay = ENTER_DELAY }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { ...ENTER_T, delay } }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {children}
    </motion.div>
  )
}
