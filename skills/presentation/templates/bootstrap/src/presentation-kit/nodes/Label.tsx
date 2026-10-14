import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_T, EASE } from '../constants'

export interface LabelProps extends Omit<HTMLMotionProps<'span'>, 'layoutId' | 'id'> {
  id: string
}

export function Label({ id, transition, ...rest }: LabelProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="label"
      data-presentation-id={id}
      {...rest}
    />
  )
}
