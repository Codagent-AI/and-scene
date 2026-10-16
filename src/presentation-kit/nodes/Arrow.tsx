import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

export interface ArrowProps extends HTMLMotionProps<'div'> {
  id: string
  /** Draw a head at both ends; exposed as `data-presentation-bidirectional`. */
  bidirectional?: boolean
  /** Line style hook, e.g. "dashed". */
  variant?: string
}

/**
 * A connector between entities. Positioned and sized by the author (class or
 * style); the arrow heads are drawn by presentation CSS from the data hooks.
 */
export function Arrow({ id, bidirectional, variant, transition, ...rest }: ArrowProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      data-presentation-node="arrow"
      data-presentation-entity={id}
      data-presentation-bidirectional={bidirectional ? 'true' : undefined}
      data-presentation-variant={variant}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      {...rest}
    />
  )
}
