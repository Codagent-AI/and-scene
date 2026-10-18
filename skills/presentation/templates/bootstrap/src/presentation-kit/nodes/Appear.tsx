import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T, EASE, EXIT_T } from '../constants'

interface AppearProps {
  children: ReactNode
  /** Seconds to wait before entering; defaults to after persisting entities settle. */
  delay?: number
}

/**
 * Wraps an entity that joins the scene. It fades in only after persisting entities
 * have finished their layout morph, and fades out when removed from a parent
 * `SceneLayer`. The fade runs once on mount: keeping the same keyed `Appear` mounted
 * across steps leaves the entity untouched, so it morphs by layout projection alone.
 */
export function Appear({ children, delay = ENTER_DELAY }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
    >
      {children}
    </motion.div>
  )
}
