import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { geometryStyle, useEntityMotion } from './entity.ts'
import type { Geometry } from './entity.ts'

export interface BoxProps extends Geometry, Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'children'> {
  children?: ReactNode
  /** Stable entity identity, shared across the steps the box persists through. */
  id: string
  /** Optional glyph, supplied as a component (for example from lucide-react). */
  icon?: LucideIcon
  label?: ReactNode
}

export function Box({ id, x, y, w, h, icon: Icon, label, style, children, ...rest }: BoxProps) {
  const entity = useEntityMotion(id)
  return (
    <motion.div data-presentation-box="" {...entity} style={geometryStyle({ x, y, w, h }, style)} {...rest}>
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {label !== undefined ? <span data-presentation-box-label="">{label}</span> : null}
      {children}
    </motion.div>
  )
}
