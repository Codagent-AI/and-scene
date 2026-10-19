import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants'
import { dataHooks, geometryStyle, type DataHooks, type Geometry, enterMotion } from './geometry'

export interface FrameProps extends Geometry, DataHooks {
  id: string
  /** Fade in as a newcomer (after persisting entities settle); toggling never remounts. */
  enter?: boolean
  label?: ReactNode
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** A rectangle drawn around other entities; carries no fill or border of its own. */
export function Frame({ id, enter, label, className, style, children, ...geometry }: FrameProps) {
  return (
    <motion.div
      {...dataHooks(geometry)}
      {...enterMotion(enter)}
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
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
