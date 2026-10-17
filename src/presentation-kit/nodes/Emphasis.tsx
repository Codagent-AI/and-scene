import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { placementStyle } from './props.ts'
import type { NodeProps } from './props.ts'

/** An emphasis marker placed over another entity (ring, highlight, flag). */
export function Emphasis({ id, at, style, children, ...rest }: NodeProps) {
  return (
    <motion.div
      {...rest}
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-node="emphasis"
      data-presentation-id={id}
      style={placementStyle(at, style)}
    >
      {children}
    </motion.div>
  )
}
