import { motion } from 'motion/react'
import { LAYOUT_TRANSITION, rectStyle, type NodeProps, type Rect } from './common.ts'

export interface EmphasisProps extends NodeProps<'div'> {
  id: string
  /** The region to emphasise. */
  at: Rect
}

/** A highlight marker drawn over a region (ring, glow, underline: the author's CSS decides). */
export function Emphasis({ id, at, style, ...rest }: EmphasisProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      aria-hidden="true"
      data-presentation-node="emphasis"
      data-entity={id}
      style={rectStyle(at, { pointerEvents: 'none', ...style })}
      {...rest}
    />
  )
}
