import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants.ts'

export interface FrameProps extends HTMLMotionProps<'div'> {
  layoutId: string
  /** Position and size in design-canvas pixels. */
  x: number
  y: number
  width: number
  height: number
}

/** A rectangle placed in canvas coordinates; presentations style the outline. */
export function Frame({ layoutId, x, y, width, height, style, ...rest }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      transition={LAYOUT_TRANSITION}
      data-presentation-frame=""
      data-presentation-id={layoutId}
      {...rest}
      style={{ position: 'absolute', left: x, top: y, width, height, ...style }}
    />
  )
}
