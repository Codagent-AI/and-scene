import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export interface LabelProps extends Geometry {
  id: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function Label({ id, className, style, children, ...geometry }: LabelProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="label"
      data-presentation-id={id}
      className={className}
      style={geometryStyle(geometry, style)}
    >
      {children}
    </motion.div>
  )
}
