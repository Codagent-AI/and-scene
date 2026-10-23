import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { EXIT, LAYOUT_TRANSITION } from '../constants'
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
      transition={{ layout: LAYOUT_TRANSITION }}
      exit={EXIT}
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
