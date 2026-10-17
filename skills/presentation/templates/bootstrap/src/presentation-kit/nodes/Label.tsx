import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { placementStyle } from './props.ts'
import type { NodeProps } from './props.ts'

export function Label({ id, at, style, children, ...rest }: NodeProps) {
  return (
    <motion.span
      {...rest}
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-node="label"
      data-presentation-id={id}
      style={placementStyle(at, style)}
    >
      {children}
    </motion.span>
  )
}
