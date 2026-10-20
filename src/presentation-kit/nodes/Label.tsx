import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants.ts'

export interface LabelProps extends HTMLMotionProps<'span'> {
  layoutId: string
}

export function Label({ layoutId, ...rest }: LabelProps) {
  return (
    <motion.span
      layout
      layoutId={layoutId}
      transition={LAYOUT_TRANSITION}
      data-presentation-label=""
      data-presentation-id={layoutId}
      {...rest}
    />
  )
}
