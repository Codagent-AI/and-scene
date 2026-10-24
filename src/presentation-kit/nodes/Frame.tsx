import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export interface FrameProps extends Geometry {
  id: string
  /** Optional caption for the frame, exposed as a styling hook. */
  label?: ReactNode
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** An unfilled region that groups or encloses other entities. */
export function Frame({ id, label, className, style, children, ...geometry }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="frame"
      data-presentation-id={id}
      className={className}
      style={{ pointerEvents: 'none', ...geometryStyle(geometry, style) }}
    >
      {label !== undefined && <span data-presentation-label="">{label}</span>}
      {children}
    </motion.div>
  )
}
