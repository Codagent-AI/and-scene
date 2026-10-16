import { motion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export interface AppearProps
  extends Omit<ComponentProps<'div'>, 'style' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  /** Extra delay (s) on top of the settle delay, for sequencing several newcomers. */
  order?: number
  style?: React.CSSProperties
  children?: ReactNode
}

/**
 * Wrap only entities that are NEW in the active step: they fade in after
 * persisting entities have moved, and fade out when they depart (inside a
 * `SceneLayer`). Entities that continue across steps must not be wrapped.
 */
export function Appear({ order = 0, style, children, ...rest }: AppearProps) {
  return (
    <motion.div
      {...rest}
      data-presentation-appear
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, ease: EASE, delay: ENTER_DELAY + order * 0.12 } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T * 0.6, ease: EASE } }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
    >
      {children}
    </motion.div>
  )
}
