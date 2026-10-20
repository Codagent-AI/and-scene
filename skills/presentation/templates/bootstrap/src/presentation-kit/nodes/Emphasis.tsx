import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { rectStyle, type NodeProps } from './common.ts'

export type EmphasisProps = NodeProps

/** Highlight marker laid over another entity. */
export function Emphasis({ id, rect, style, children, ...rest }: EmphasisProps) {
  return (
    <motion.div
      {...rest}
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-entity={id}
      data-presentation-node="emphasis"
      style={rectStyle(rect, style)}
    >
      {children}
    </motion.div>
  )
}
