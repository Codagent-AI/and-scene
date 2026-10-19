import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, EXIT_T } from '../constants'

export interface AppearProps {
  /** Entities that are only part of some steps: render while true. */
  when?: boolean
  children: ReactNode
}

/**
 * Newcomer wrapper: fades children in after persisting entities have moved
 * (ENTER_DELAY) and out when `when` turns false. Children that stay mounted are
 * not re-faded. Contents are positioned by the entities themselves, so the
 * wrapper adds no layout of its own.
 */
export function Appear({ when = true, children }: AppearProps) {
  return (
    <AnimatePresence>
      {when ? (
        <motion.div
          data-presentation-appear=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE } }}
          exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
