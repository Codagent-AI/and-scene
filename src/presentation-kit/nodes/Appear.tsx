import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T, EXIT_T } from '../constants'
import { dataHooks, type DataHooks } from './geometry'

export interface AppearProps extends DataHooks {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Wrap only genuinely new entities. They fade in after persisting entities have moved
 * (ENTER_DELAY) and fade out when removed. Continuing entities must not be wrapped.
 */
export function Appear({ className, style, children, ...hooks }: AppearProps) {
  return (
    <motion.div
      {...dataHooks(hooks)}
      data-presentation-appear=""
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
    >
      {children}
    </motion.div>
  )
}
