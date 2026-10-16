import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { placementStyle, type Placement } from './geometry'

export interface BoxProps
  extends Placement,
    Omit<ComponentProps<'div'>, 'id' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'style'> {
  /** Stable entity identity; becomes the motion `layoutId`. */
  id: string
  Icon?: LucideIcon
  style?: ComponentProps<typeof motion.div>['style']
  children?: ReactNode
}

/** Generic morphing entity. Supplies no visual styling. */
export function Box({ id, Icon, x, y, w, h, style, children, ...rest }: BoxProps) {
  return (
    <motion.div
      {...rest}
      layoutId={id}
      data-presentation-node="box"
      data-presentation-id={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      style={placementStyle({ x, y, w, h }, style as React.CSSProperties)}
    >
      {Icon ? <Icon data-presentation-icon aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
