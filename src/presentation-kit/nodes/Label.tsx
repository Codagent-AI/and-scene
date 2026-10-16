import { motion } from 'motion/react'
import { LAYOUT_TRANSITION, rectStyle, type NodeProps, type Rect } from './common.ts'

export interface LabelProps extends NodeProps<'span'> {
  id: string
  at?: Rect
}

/** Free-standing text entity; its position morphs, its text re-labels in place. */
export function Label({ id, at, style, children, ...rest }: LabelProps) {
  return (
    <motion.span
      layout="position"
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="label"
      data-entity={id}
      style={rectStyle(at, style)}
      {...rest}
    >
      {children}
    </motion.span>
  )
}
