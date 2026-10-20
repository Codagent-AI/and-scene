import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'

export interface EmphasisProps extends HTMLMotionProps<'div'> {
  layoutId: string
  x: number
  y: number
  width: number
  height: number
}

/** An emphasis marker laid over an entity; presentations style how it looks. */
export function Emphasis({ layoutId, x, y, width, height, style, ...rest }: EmphasisProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-emphasis=""
      data-presentation-id={layoutId}
      aria-hidden="true"
      {...rest}
      style={{ position: 'absolute', left: x, top: y, width, height, pointerEvents: 'none', ...style }}
    />
  )
}
