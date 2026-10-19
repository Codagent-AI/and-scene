import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { leave, morph, place } from './shared.ts'
import type { NodeProps } from './shared.ts'

export interface FrameProps extends NodeProps {
  /** Optional caption for the frame. */
  label?: ReactNode
  children?: ReactNode
}

/** An outline region around other entities; it draws nothing by itself. */
export function Frame({ layoutId, x, y, w, h, label, children, style, ...rest }: FrameProps) {
  return (
    <motion.div
      {...(rest as object)}
      layout
      layoutId={layoutId}
      transition={morph}
      exit={leave}
      style={place({ x, y, w, h }, style)}
      data-presentation-node="frame"
      data-presentation-entity={layoutId}
    >
      {label ? <span data-presentation-frame-label="">{label}</span> : null}
      {children}
    </motion.div>
  )
}
