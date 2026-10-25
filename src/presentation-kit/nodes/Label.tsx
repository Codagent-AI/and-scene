import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { nodeAttrs, placement, type NodeProps } from './base.ts'

export function Label({ id, at, style, allowOverlap, children, ...rest }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...nodeAttrs('label', id, allowOverlap)}
      {...rest}
      style={placement(at, style)}
    >
      {children}
    </motion.div>
  )
}
