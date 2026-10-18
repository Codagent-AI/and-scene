import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, EXIT_T } from '../constants'

export interface AppearProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Wrap only entities that are new in the active step. They fade in after the
 * continuing entities have finished their layout morph. Give it a stable `key`
 * and render it directly inside a `SceneLayer` so it can also exit.
 */
export function Appear({ className, style, children, ...rest }: AppearProps) {
  return (
    <motion.div
      {...rest}
      data-presentation-appear=""
      className={className}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, ...style }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
    >
      {children}
    </motion.div>
  )
}
