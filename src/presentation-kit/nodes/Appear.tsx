import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EXIT_T } from '../constants.ts'
import { dataProps, type NodeProps } from './props.ts'

interface AppearProps extends NodeProps {
  /** Extra seconds to wait after the persisting entities have settled. */
  delay?: number
  children?: ReactNode
}

/**
 * Wraps a newly introduced entity: it fades in only after persisting entities have
 * moved (ENTER_DELAY), and fades out on exit when placed under `AnimatePresence`.
 * Entities that continue across steps keep this wrapper mounted, so it never replays.
 */
export function Appear({ className, style, delay = 0, children, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: ENTER_DELAY + delay, duration: ENTER_T } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      {...dataProps(rest)}
    >
      {children}
    </motion.div>
  )
}
