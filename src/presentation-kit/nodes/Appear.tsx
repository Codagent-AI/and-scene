import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EXIT_T } from '../constants.ts'
import { appearProps } from './appearProps.ts'

export interface AppearProps extends HTMLMotionProps<'div'> {
  delay?: number
}

/**
 * Wraps a newcomer. The animation runs on mount only, so an entity that keeps
 * being rendered through later steps is never faded in again.
 */
export function Appear({ delay, style, children, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      {...appearProps(delay)}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none', ...style }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
