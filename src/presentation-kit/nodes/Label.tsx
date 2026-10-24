import { motion } from 'motion/react'
import { boxStyle, LAYOUT_TRANSITION, type NodeProps } from './shared'

/** Positioned text label. */
export function Label({ id, className, children, ...rest }: NodeProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="label"
      data-presentation-id={id}
      className={className}
      style={boxStyle({ id, ...rest })}
    >
      {children}
    </motion.span>
  )
}
