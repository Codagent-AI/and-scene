import { motion } from 'motion/react'
import { LAYOUT_TRANSITION, rectStyle, type NodeProps, type Rect } from './common.ts'

export interface FrameProps extends NodeProps<'div'> {
  id: string
  at: Rect
}

/** An outline/grouping region. Children (e.g. a label) are placed by the author. */
export function Frame({ id, at, style, children, ...rest }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="frame"
      data-entity={id}
      style={rectStyle(at, { pointerEvents: 'none', ...style })}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
