import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, EXIT_T } from '../constants'

export interface AppearProps extends HTMLMotionProps<'div'> {
  /** Extra delay (seconds) after persisting entities have settled. */
  delay?: number
}

/**
 * Wraps a newcomer entity: fades in only after persisting entities finish their
 * layout morph, and fades out on exit. Do not wrap continuing entities.
 */
export function Appear({ delay = 0, children, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY + delay, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
