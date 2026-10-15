import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'

export interface LabelProps extends Omit<HTMLMotionProps<'span'>, 'id' | 'children' | 'layoutId'> {
  id: string
  children?: ReactNode
}

export function Label({ id, children, ...rest }: LabelProps) {
  return (
    <motion.span
      {...rest}
      layout
      layoutId={id}
      transition={LAYOUT_T}
      data-presentation-node="label"
      data-presentation-id={id}
    >
      {children}
    </motion.span>
  )
}
