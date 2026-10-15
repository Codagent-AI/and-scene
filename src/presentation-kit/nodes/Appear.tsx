import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EXIT } from '../constants'

export interface AppearProps {
  children: ReactNode
  /** Extra delay (s) on top of the settle delay, for sequencing several newcomers. */
  delay?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Wraps newcomers only. Fades in after persisting entities settle their layout move.
 * Do not wrap entities that continue across steps.
 */
export function Appear({ children, delay = 0, className, style }: AppearProps) {
  return (
    <motion.div
      data-presentation-node="appear"
      className={className}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { ...ENTER_T, delay: ENTER_DELAY + delay } }}
      exit={EXIT}
    >
      {children}
    </motion.div>
  )
}
