import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, EXIT_T } from '../constants'

export type AppearProps = HTMLMotionProps<'div'> & { delay?: number }

/**
 * Wraps a newcomer so it fades in after persisting entities have moved. The entry is
 * applied on mount only, so a wrapper that stays in the tree is inert on later steps.
 */
export function Appear({ delay = ENTER_DELAY, style, children, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: EXIT_T, delay: 0 } }}
      transition={{ duration: ENTER_T, delay, ease: EASE }}
      {...rest}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
    >
      {children}
    </motion.div>
  )
}
