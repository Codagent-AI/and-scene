import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { entityProps } from './entity'

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
      {...entityProps(id, 'arrow', undefined, transition)}
      data-presentation-bidirectional={bidirectional ? 'true' : undefined}
      data-presentation-variant={variant}
      {...rest}
    />
  )
}
