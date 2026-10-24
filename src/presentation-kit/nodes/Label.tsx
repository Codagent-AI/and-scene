import { motion } from 'motion/react'
import { LAYOUT_TRANSITION, placementStyle, type DivProps, type NodeBaseProps } from './shared.ts'

export interface LabelProps
  extends NodeBaseProps,
    DivProps {}

export function Label({ id, x, y, w, h, className, style, children, ...rest }: LabelProps) {
  return (
    <motion.div
      {...rest}
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      className={className}
      style={placementStyle({ x, y, w, h }, style)}
      data-presentation-label=""
      data-presentation-entity={id}
    >
      {children}
    </motion.div>
  )
}
