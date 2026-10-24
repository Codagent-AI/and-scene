import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps, type MotionStyle } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { placement, useEntityProps, type Geometry } from './shared'

export interface NodeProps
  extends Geometry,
    Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'initial' | 'animate' | 'exit' | 'style' | 'children'> {
  style?: MotionStyle
  children?: ReactNode
  /** Stable identity: becomes the `layoutId`, so the entity morphs across steps. */
  id: string
}

export interface EntityNodeProps extends NodeProps {
  kind: string
  /** Optional glyph, as a Lucide icon component. */
  icon?: LucideIcon
}

/** Generic positioned entity; Box, Label, Frame, and Emphasis are named uses of it. */
export function EntityNode({ kind, id, x, y, w, h, icon: Icon, style, children, ...rest }: EntityNodeProps) {
  const entity = useEntityProps(kind, id)
  return (
    <motion.div {...entity} {...rest} style={placement({ x, y, w, h }, style)}>
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </motion.div>
  )
}
