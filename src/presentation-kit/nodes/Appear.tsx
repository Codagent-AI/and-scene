import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export interface AppearProps {
  children: ReactNode
  delay?: number
  className?: string
}

/** Sequences a newcomer's entrance to start only after persisting entities' layout morph settles. */
export function Appear({ children, delay = ENTER_DELAY, className }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: ENTER_T, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
