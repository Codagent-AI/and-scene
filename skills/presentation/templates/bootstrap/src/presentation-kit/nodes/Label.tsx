import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { geometryStyle, type DataProps, type Geometry } from './shared'

export interface LabelProps extends DataProps {
  id: string
  geometry?: Geometry
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function Label({ id, geometry, className, style, children, ...data }: LabelProps) {
  return (
    <motion.div
      {...data}
      layout
      layoutId={id}
      className={className}
      style={{ ...geometryStyle(geometry), ...style }}
      data-presentation-node="label"
      data-presentation-id={id}
    >
      {children}
    </motion.div>
  )
}
