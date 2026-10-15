import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT, LAYOUT_T } from '../constants'

export interface FrameProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'children' | 'layoutId'> {
  id: string
  children?: ReactNode
  /** Optional caption rendered as the first child with a styling hook. */
  label?: string
}

/** Grouping container for related entities. */
export function Frame({ id, label, children, exit = EXIT, ...rest }: FrameProps) {
  return (
    <motion.div
      {...rest}
      exit={exit}
      layout
      layoutId={id}
      transition={LAYOUT_T}
      data-presentation-node="frame"
      data-presentation-id={id}
    >
      {label && <span data-presentation-frame-label="">{label}</span>}
      {children}
    </motion.div>
  )
}
