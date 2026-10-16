import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

export interface FrameProps extends HTMLMotionProps<'div'> {
  id: string
}

/** Outline that encloses other entities; carries no border of its own. */
export function Frame({ id, transition, ...rest }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      data-presentation-node="frame"
      data-presentation-entity={id}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      {...rest}
    />
  )
}
