import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'

export interface LabelProps extends HTMLMotionProps<'span'> {
  layoutId: string
}

export function Label({ layoutId, ...rest }: LabelProps) {
  return (
    <motion.span
      layout
      layoutId={layoutId}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-label=""
      data-presentation-id={layoutId}
      {...rest}
    />
  )
}
