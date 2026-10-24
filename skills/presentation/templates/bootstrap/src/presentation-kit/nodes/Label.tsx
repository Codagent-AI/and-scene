import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { placement } from './place.ts'
import type { NodeProps } from './types.ts'

export function Label({ id, at, className, style, variant, children }: NodeProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="label"
      data-presentation-id={id}
      data-variant={variant}
      className={className}
      style={placement(at, style)}
    >
      {children}
    </motion.span>
  )
}
