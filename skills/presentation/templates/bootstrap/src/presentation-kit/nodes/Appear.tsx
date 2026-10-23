import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T, EXIT_T } from '../constants.ts'

export interface AppearProps {
  children: ReactNode
  /** Seconds to wait; defaults to the persisting layout morph duration. */
  delay?: number
  className?: string
}

/**
 * Wraps a newcomer: it fades in only after persisting entities finish their
 * layout morph, and fades out when it departs. Place direct children of
 * `SceneLayer` (an AnimatePresence) with a stable `key`. Continuing entities
 * must not be wrapped.
 */
export function Appear({ children, delay = ENTER_DELAY, className }: AppearProps) {
  return (
    <motion.div
      className={className}
      data-presentation-appear=""
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
    >
      {children}
    </motion.div>
  )
}
