import { motion } from 'motion/react'
import { boxStyle, LAYOUT_TRANSITION, type NodeProps } from './shared'

/** Positioned outline region for grouping or framing other entities. */
export function Frame({ id, className, children, ...rest }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="frame"
      data-presentation-id={id}
      className={className}
      style={{ pointerEvents: 'none', ...boxStyle({ id, ...rest }) }}
    >
      {children}
    </motion.div>
  )
}
