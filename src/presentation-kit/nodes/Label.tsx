import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

export interface LabelProps extends HTMLMotionProps<'span'> {
  id: string
}

export function Label({ id, transition, ...rest }: LabelProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      data-presentation-node="label"
      data-presentation-entity={id}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      {...rest}
    />
  )
}
