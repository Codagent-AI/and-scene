import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { LAYOUT_T, EASE } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export interface BoxProps extends Geometry {
  /** Stable entity identity, used as the layoutId. */
  id: string
  Icon?: LucideIcon
  label?: ReactNode
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function Box({ id, Icon, label, className, style, children, ...geometry }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="box"
      data-presentation-id={id}
      className={className}
      style={geometryStyle(geometry, style)}
    >
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {label !== undefined && <span data-presentation-label="">{label}</span>}
      {children}
    </motion.div>
  )
}
