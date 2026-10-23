import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants'
import { geometryStyle, type DataProps, type Geometry } from './shared'

export interface EmphasisProps extends DataProps {
  id: string
  geometry?: Geometry
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Highlight marker drawn over another entity; it morphs like any other layoutId element. */
export function Emphasis({ id, geometry, className, style, children, ...data }: EmphasisProps) {
  return (
    <motion.div
      {...data}
      layout
      transition={{ layout: LAYOUT_TRANSITION }}
      layoutId={id}
      className={className}
      style={{ ...geometryStyle(geometry), ...style }}
      data-presentation-node="emphasis"
      data-presentation-id={id}
    >
      {children}
    </motion.div>
  )
}
