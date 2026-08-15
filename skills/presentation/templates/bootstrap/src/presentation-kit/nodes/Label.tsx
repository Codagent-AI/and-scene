import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { withBaseClass } from './classNames'

export function Label({ layoutId, className, ...props }: Omit<HTMLMotionProps<'span'>, 'layoutId'> & { layoutId: string }) {
  return (
    <motion.span
      {...props}
      layout
      layoutId={layoutId}
      className={withBaseClass('presentation-label', className)}
      data-presentation-node="label"
    />
  )
}
