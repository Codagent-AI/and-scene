import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { placementStyle } from './props.ts'
import type { NodeProps } from './props.ts'

/** A rectangle around part of, or all of, the diagram. Styling comes from the presentation. */
export function Frame({ id, at, style, children, ...rest }: NodeProps) {
  return (
    <motion.div
      {...rest}
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-node="frame"
      data-presentation-id={id}
      style={placementStyle(at, style)}
    >
      {children}
    </motion.div>
  )
}
