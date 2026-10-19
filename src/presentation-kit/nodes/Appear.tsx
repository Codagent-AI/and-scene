import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T, EXIT_T } from '../constants.ts'

export interface AppearProps {
  /** True only for entities that are new in the active step. */
  enter?: boolean
  children?: ReactNode
}

/**
 * Wraps one entity. A newcomer fades in after continuing entities finish
 * morphing; the entrance runs at mount only, so continuing entities never
 * re-fade. On removal it fades out (kept alive by the surrounding AnimatePresence).
 */
export function Appear({ enter = false, children }: AppearProps) {
  return (
    <motion.div
      initial={enter ? { opacity: 0 } : false}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      data-presentation-appear={enter ? 'enter' : 'stay'}
    >
      {children}
    </motion.div>
  )
}
