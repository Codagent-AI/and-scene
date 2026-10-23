import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants'
import type { LucideIcon } from 'lucide-react'
import { geometryStyle, type DataProps, type Geometry } from './shared'

export interface BoxProps extends DataProps {
  id: string
  geometry?: Geometry
  className?: string
  style?: CSSProperties
  icon?: LucideIcon
  emphasized?: boolean
  children?: ReactNode
}

export function Box({ id, geometry, className, style, icon: Icon, emphasized, children, ...data }: BoxProps) {
  return (
    <motion.div
      {...data}
      layout
      transition={{ layout: LAYOUT_TRANSITION }}
      layoutId={id}
      className={className}
      style={{ ...geometryStyle(geometry), ...style }}
      data-presentation-node="box"
      data-presentation-id={id}
      data-presentation-emphasis={emphasized ? 'true' : undefined}
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-glyph="" /> : null}
      {children}
    </motion.div>
  )
}
