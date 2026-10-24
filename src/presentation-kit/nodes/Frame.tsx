import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { LAYOUT_TRANSITION, placementStyle, type DivProps, type NodeBaseProps } from './shared.ts'

export interface FrameProps
  extends NodeBaseProps,
    DivProps {
  label?: ReactNode
}

/** A region that encloses other entities; it draws nothing unless the author styles it. */
export function Frame({ id, x, y, w, h, className, style, label, children, ...rest }: FrameProps) {
  return (
    <motion.div
      {...rest}
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      className={className}
      style={placementStyle({ x, y, w, h }, style)}
      data-presentation-frame=""
      data-presentation-entity={id}
    >
      {label !== undefined ? <span data-presentation-frame-label="">{label}</span> : null}
      {children}
    </motion.div>
  )
}
