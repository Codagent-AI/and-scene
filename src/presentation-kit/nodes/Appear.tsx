import { AnimatePresence, motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { appearTransition, EXIT_TRANSITION } from '../motion'

export interface AppearProps {
  children?: ReactNode
  /** Extra delay (seconds) after the base newcomer delay. */
  offset?: number
  className?: string
  style?: CSSProperties
}

/**
 * Wrap only newcomers. Enters after persisting entities have settled and
 * exits when removed (render it inside a SceneLayer, with a stable key).
 */
export function Appear({ children, offset, className, style }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: appearTransition(offset) }}
      exit={{ opacity: 0, transition: EXIT_TRANSITION }}
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      {children}
    </motion.div>
  )
}

export interface SceneLayerProps {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/** Absolutely positions one step's diagram so layers never reflow each other. */
export function SceneLayer({ children, className, style }: SceneLayerProps) {
  return (
    <div data-presentation-scene-layer="" className={className} style={{ position: 'absolute', inset: 0, ...style }}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
