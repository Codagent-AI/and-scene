import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'

/**
 * Wraps a newcomer so it fades in after continuing entities have finished moving.
 * Wrap it in `AnimatePresence` (inside the scene) so it can also fade out on departure.
 * Never wrap an entity that continues across steps.
 */
export function Appear({ children, delay = ENTER_DELAY }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      data-presentation-appear
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T / 2 } }}
    >
      {children}
    </motion.div>
  )
}
