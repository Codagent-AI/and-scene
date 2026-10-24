import { motion } from 'motion/react'
import { boxStyle, LAYOUT_TRANSITION, type NodeProps } from './shared'

/** Positioned marker that draws attention to the entity beneath it. */
export function Emphasis({ id, className, children, ...rest }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="emphasis"
      data-presentation-id={id}
      aria-hidden="true"
      className={className}
      style={{ pointerEvents: 'none', ...boxStyle({ id, ...rest }) }}
    >
      {children}
    </motion.div>
  )
}
