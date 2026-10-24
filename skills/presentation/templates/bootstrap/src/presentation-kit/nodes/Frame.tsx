import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { placement } from './place.ts'
import type { NodeProps } from './types.ts'

/** Bounding region drawn around other entities; children are its caption/label. */
export function Frame({ id, at, className, style, variant, children }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="frame"
      data-presentation-id={id}
      data-variant={variant}
      className={className}
      style={placement(at, style)}
    >
      {children}
    </motion.div>
  )
}
