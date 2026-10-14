import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_T, EASE } from '../constants'

export interface FrameProps extends Omit<HTMLMotionProps<'div'>, 'layoutId' | 'id'> {
  id: string
}

/** A grouping region that morphs in place; children are laid out by the author. */
export function Frame({ id, transition, ...rest }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="frame"
      data-presentation-id={id}
      {...rest}
    />
  )
}
