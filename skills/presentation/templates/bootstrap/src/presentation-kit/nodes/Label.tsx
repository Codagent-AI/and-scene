import { motion } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants.ts'
import type { NodeProps } from './Box.tsx'

/** Free text entity. */
export function Label({ id, className, style, children }: NodeProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="label"
      data-presentation-id={id}
      className={className}
      style={{ position: 'absolute', ...style }}
    >
      {children}
    </motion.span>
  )
}
