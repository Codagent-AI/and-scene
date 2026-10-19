import type { CSSProperties, ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

export interface Rect {
  x: number
  y: number
  w?: number
  h?: number
}

export interface EntityProps extends Rect, Omit<HTMLMotionProps<'div'>, 'children' | 'style' | 'layoutId' | 'id'> {
  /** Stable identity: used as the Motion layoutId and the entity hook. */
  id: string
  /** Primitive kind, exposed as data-presentation-kind. */
  kind?: string
  emphasis?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Absolutely positioned, layout-animated entity. Every node primitive builds on this. */
export function Entity({ id, kind = 'entity', x, y, w, h, emphasis, style, children, ...rest }: EntityProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-entity={id}
      data-presentation-kind={kind}
      data-presentation-emphasis={emphasis ? 'true' : undefined}
      {...rest}
      style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }}
    >
      {children}
    </motion.div>
  )
}
