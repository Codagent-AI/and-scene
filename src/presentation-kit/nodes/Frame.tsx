import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { rectStyle, type NodeProps } from './common.ts'

export type FrameProps = NodeProps

/** Outline entity that can enclose other entities. */
export function Frame({ id, rect, style, children, ...rest }: FrameProps) {
  return (
    <motion.div
      {...rest}
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-entity={id}
      data-presentation-node="frame"
      style={rectStyle(rect, style)}
    >
      {children}
    </motion.div>
  )
}
