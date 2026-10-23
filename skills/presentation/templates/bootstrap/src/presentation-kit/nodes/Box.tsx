import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { entityProps, placeStyle, type Rect } from './geometry'

export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'children'> {
  children?: ReactNode
  /** Stable entity identity, used as the shared layoutId. */
  entity: string
  at?: Rect
  /** Optional glyph, passed as a component (icon-as-component). */
  Icon?: LucideIcon
}

export function Box({ entity, at, Icon, style, children, ...rest }: BoxProps) {
  return (
    <motion.div
      {...entityProps(entity, 'box')}
      {...rest}
      style={placeStyle(at, style)}
    >
      {Icon && <Icon data-presentation-box-icon="" aria-hidden="true" />}
      {children}
    </motion.div>
  )
}
