import { motion } from 'motion/react'
import type { ComponentPropsWithoutRef } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export interface FrameProps extends Omit<ComponentPropsWithoutRef<typeof motion.div>, 'layout'> {
  layoutId: string
}

/** Grouping container (e.g. a "reveal" frame around several entities) that itself morphs. */
export function Frame({ layoutId, children, className, transition, ...rest }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      data-presentation-frame=""
      className={className}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
