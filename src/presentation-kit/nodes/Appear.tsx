import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export interface AppearProps {
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/**
 * Sequences a newcomer entity's enter animation to start only after
 * persisting entities have finished their layout-projection morph.
 */
export function Appear({ className, style, children }: AppearProps) {
  return (
    <motion.div
      className={className}
      data-presentation-node="appear"
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
