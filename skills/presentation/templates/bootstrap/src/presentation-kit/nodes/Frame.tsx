import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants'

/** A grouping region (container) entity. */
export interface FrameProps extends Omit<HTMLMotionProps<'div'>, 'layoutId' | 'id' | 'children'> {
  children?: ReactNode
  id: string
}

export function Frame({ id, children, ...rest }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-entity={id}
      data-presentation-node="frame"
      {...rest}
    >
      {children}
    </motion.div>
  )
}
