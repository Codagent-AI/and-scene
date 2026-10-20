import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants.ts'

interface AppearProps {
  children: ReactNode
  /** Seconds to wait; defaults to the full layout morph duration. */
  delay?: number
}

/**
 * Enters newcomers after persisting entities have finished moving. Wrap only
 * entities that are new in a step; continuing entities stay outside it.
 * Place inside an AnimatePresence to also animate departures.
 */
export function Appear({ children, delay = ENTER_DELAY }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { ...ENTER_T, delay } }}
      exit={{ opacity: 0, transition: ENTER_T }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {children}
    </motion.div>
  )
}
