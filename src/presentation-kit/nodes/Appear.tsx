import { AnimatePresence, motion } from 'motion/react'
import type { ComponentProps, HTMLAttributes, ReactNode } from 'react'
import { appearTransition, EXIT_TRANSITION } from '../motion'

export interface AppearProps extends Omit<ComponentProps<typeof motion.div>, 'children' | 'initial' | 'animate' | 'exit'> {
  children?: ReactNode
  /** Extra delay (seconds) after the base newcomer delay. */
  offset?: number
}

/**
 * Wrap only newcomers. Enters after persisting entities have settled and
 * exits when removed (render it inside a SceneLayer, with a stable key).
 */
export function Appear({ children, offset, style, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      {...rest}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: appearTransition(offset) }}
      exit={{ opacity: 0, transition: EXIT_TRANSITION }}
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      {children}
    </motion.div>
  )
}

export interface SceneLayerProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

/** Absolutely positions one step's diagram so layers never reflow each other. */
export function SceneLayer({ children, style, ...rest }: SceneLayerProps) {
  return (
    <div data-presentation-scene-layer="" {...rest} style={{ position: 'absolute', inset: 0, ...style }}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  )
}
