import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants'
import { dataHooks, geometryStyle, type DataHooks, type Geometry } from './geometry'

export interface LabelProps extends Geometry, DataHooks {
  id: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function Label({ id, className, style, children, ...geometry }: LabelProps) {
  return (
    <motion.span
      {...dataHooks(geometry)}
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      data-presentation-node="label"
      data-presentation-id={id}
      className={className}
      style={geometryStyle(geometry, style)}
    >
      {children}
    </motion.span>
  )
}
