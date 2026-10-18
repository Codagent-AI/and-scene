import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { APPEAR_ANIMATE, APPEAR_EXIT, APPEAR_INITIAL } from './motion'

/**
 * Fades a newcomer in after persisting entities have finished their layout morph.
 * The animation runs on mount only, so an entity that keeps its place in the tree is never
 * re-faded. Keep one `Appear` per entity across steps; do not add or remove the wrapper.
 */
export function Appear({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={APPEAR_INITIAL}
      animate={APPEAR_ANIMATE}
      exit={APPEAR_EXIT}
      style={{ position: 'absolute', inset: 0 }}
      data-presentation-appear=""
    >
      {children}
    </motion.div>
  )
}
