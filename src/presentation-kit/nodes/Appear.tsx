import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, EXIT_T } from '../constants.ts'

export type AppearProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children?: ReactNode
  /** Seconds to wait; defaults to the time persisting entities need to settle. */
  delay?: number
}

/**
 * Fades a newcomer in after persisting entities have moved. The fade runs only
 * when this element mounts, so an entity that keeps rendering through it is
 * never re-faded on later steps.
 */
export function Appear({ delay = ENTER_DELAY, style, children, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      transition={{ delay, duration: ENTER_T, ease: EASE }}
      {...rest}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
    >
      {children}
    </motion.div>
  )
}
