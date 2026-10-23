import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { geometryStyle, type DataProps, type Geometry } from './shared'

export interface FrameProps extends DataProps {
  id: string
  geometry: Geometry
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function Frame({ id, geometry, className, style, children, ...data }: FrameProps) {
  return (
    <motion.div
      {...data}
      layout
      layoutId={id}
      className={className}
      style={{ ...geometryStyle(geometry), ...style }}
      data-presentation-node="frame"
      data-presentation-id={id}
    >
      {children}
    </motion.div>
  )
}
