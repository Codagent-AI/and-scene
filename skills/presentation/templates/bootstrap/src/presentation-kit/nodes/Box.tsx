import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_TRANSITION, rectStyle, type NodeProps, type Rect } from './common.ts'

export interface BoxProps extends NodeProps<'div'> {
  /** Stable entity id; becomes the `layoutId`, so the box morphs across steps. */
  id: string
  /** Position in design-canvas coordinates; omit to lay out with your own CSS. */
  at?: Rect
  /** Optional glyph rendered before the children. */
  Icon?: LucideIcon
}

/** A generic card-like entity. Carries identity and style hooks, no styling. */
export function Box({ id, at, Icon, style, children, ...rest }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="box"
      data-entity={id}
      style={rectStyle(at, style)}
      {...rest}
    >
      {Icon && <Icon data-presentation-icon="" aria-hidden="true" />}
      {children}
    </motion.div>
  )
}
