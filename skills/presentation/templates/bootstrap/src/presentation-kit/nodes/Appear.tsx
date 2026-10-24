import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants.ts'

export interface AppearProps {
  /** Whether the newcomer is present in the current step. */
  when?: boolean
  /** Extra delay (s) after the persisting entities have settled. */
  delay?: number
  children: ReactNode
}

/**
 * Wraps newcomers only: it fades them in once persisting entities finished
 * morphing, and fades them out when they leave. Never wrap continuing entities.
 */
export function Appear({ when = true, delay = 0, children }: AppearProps) {
  return (
    <AnimatePresence>
      {when ? (
        <motion.div
          key="appear"
          data-presentation-appear=""
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { ...ENTER_T, delay: ENTER_DELAY + delay } }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
