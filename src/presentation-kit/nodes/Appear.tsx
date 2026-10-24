import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'

/**
 * Newcomer wrapper: fades its children in only after persisting entities have
 * finished their layout morph. Children share the scene's coordinate space.
 */
export function Appear({ children }: { children: ReactNode }) {
  return (
    <motion.div
      data-presentation-appear=""
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T } }}
    >
      {children}
    </motion.div>
  )
}
