import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { placement } from './place.ts'
import type { NodeProps } from './types.ts'

/** Marker (flag, ring, highlight) laid over another entity. */
export function Emphasis({ id, at, className, style, variant, children }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="emphasis"
      data-presentation-id={id}
      data-variant={variant}
      className={className}
      style={placement(at, style)}
    >
      {children}
    </motion.div>
  )
}
