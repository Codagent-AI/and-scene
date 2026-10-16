import { motion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { placementStyle, type Placement } from './geometry'

export interface FrameProps
  extends Placement,
    Omit<ComponentProps<'div'>, 'id' | 'style' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  id: string
  style?: React.CSSProperties
  children?: ReactNode
}

/** Grouping region that morphs; children are positioned inside it by the author. */
export function Frame({ id, x, y, w, h, style, children, ...rest }: FrameProps) {
  return (
    <motion.div
      {...rest}
      layoutId={id}
      data-presentation-node="frame"
      data-presentation-id={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      style={placementStyle({ x, y, w, h }, style)}
    >
      {children}
    </motion.div>
  )
}
