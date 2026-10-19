import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export interface BoxProps extends Geometry {
  /** Stable entity identity; morphs across steps. */
  id: string
  Icon?: LucideIcon
  label?: ReactNode
  emphasis?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function Box({ id, Icon, label, emphasis, className, style, children, ...geometry }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="box"
      data-presentation-id={id}
      data-presentation-emphasis={emphasis ? 'true' : undefined}
      className={className}
      style={geometryStyle(geometry, style)}
    >
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : null}
      {label !== undefined ? <span data-presentation-label="">{label}</span> : null}
      {children}
    </motion.div>
  )
}
