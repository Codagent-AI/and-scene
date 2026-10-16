import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'

export interface AppearProps extends HTMLMotionProps<'div'> {
  /** Extra seconds added after `ENTER_DELAY`, to sequence several newcomers. */
  order?: number
}

/**
 * Wraps entities that exist in only some steps. They fade in after persisting
 * entities settle and fade out on exit. Do not wrap entities that continue
 * across grouped steps; those morph via layout projection.
 */
export function Appear({ order = 0, children, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY + order } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T } }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
