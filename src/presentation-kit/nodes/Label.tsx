import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants'

export interface LabelProps extends Omit<HTMLMotionProps<'span'>, 'layoutId' | 'id' | 'children'> {
  children?: ReactNode
  id: string
}

export function Label({ id, children, ...rest }: LabelProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-entity={id}
      data-presentation-node="label"
      {...rest}
    >
      {children}
    </motion.span>
  )
}
