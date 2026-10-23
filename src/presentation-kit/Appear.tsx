import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T } from './constants'

/**
 * Wraps an entity so newcomers fade in after persisting entities have finished
 * morphing. `entering` is false for continuing entities: they keep the same
 * wrapper and skip the entry animation, so they morph instead of fading.
 */
export function Appear({ entering = true, children }: { entering?: boolean; children: ReactNode }) {
  return (
    <motion.div
      data-presentation-appear={entering ? 'entering' : 'continuing'}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      initial={entering ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={entering ? { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}
