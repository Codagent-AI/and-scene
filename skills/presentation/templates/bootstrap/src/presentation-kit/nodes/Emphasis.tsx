import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants.ts'

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
      transition={LAYOUT_TRANSITION}
      data-presentation-emphasis=""
      data-presentation-id={layoutId}
      aria-hidden="true"
      {...rest}
      style={{ position: 'absolute', left: x, top: y, width, height, pointerEvents: 'none', ...style }}
    />
  )
}
