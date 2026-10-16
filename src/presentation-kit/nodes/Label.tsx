import { motion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { placementStyle, type Placement } from './geometry'

export interface LabelProps
  extends Placement,
    Omit<ComponentProps<'span'>, 'id' | 'style' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  id: string
  style?: React.CSSProperties
  children?: ReactNode
}

/** Text entity that keeps identity (and morphs) across steps. */
export function Label({ id, x, y, w, h, style, children, ...rest }: LabelProps) {
  return (
    <motion.span
      {...rest}
      layoutId={id}
      data-presentation-node="label"
      data-presentation-id={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      style={placementStyle({ x, y, w, h }, style)}
    >
      {children}
    </motion.span>
  )
}
