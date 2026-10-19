import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants'
import { dataHooks, geometryStyle, type DataHooks, type Geometry, useEnterMotion } from './geometry'

export interface EmphasisProps extends Geometry, DataHooks {
  id: string
  /** Fade in as a newcomer (after persisting entities settle); toggling never remounts. */
  enter?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Marks an area as emphasized via `data-presentation-emphasis`; the look is presentation-owned. */
export function Emphasis({ id, enter, className, style, children, ...geometry }: EmphasisProps) {
  return (
    <motion.div
      {...dataHooks(geometry)}
      {...useEnterMotion(enter)}
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      data-presentation-node="emphasis"
      data-presentation-id={id}
      data-presentation-emphasis="true"
      className={className}
      style={geometryStyle(geometry, style)}
    >
      {children}
    </motion.div>
  )
}
