import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export interface FrameProps extends Geometry {
  id: string
  label?: ReactNode
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** A rectangle drawn around other entities; carries no fill or border of its own. */
export function Frame({ id, label, className, style, children, ...geometry }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="frame"
      data-presentation-id={id}
      className={className}
      style={geometryStyle({ x: 0, y: 0, ...geometry }, style)}
    >
      {label !== undefined ? <span data-presentation-label="">{label}</span> : null}
      {children}
    </motion.div>
  )
}
