import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { rectStyle, type NodeProps } from './common.ts'

export type LabelProps = NodeProps

/** Text entity. */
export function Label({ id, rect, style, children, ...rest }: LabelProps) {
  return (
    <motion.span
      {...rest}
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-entity={id}
      data-presentation-node="label"
      style={rectStyle(rect, style)}
    >
      {children}
    </motion.span>
  )
}
