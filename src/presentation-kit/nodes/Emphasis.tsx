import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { withBaseClass } from './classNames'

export function Emphasis({ layoutId, className, ...props }: Omit<HTMLMotionProps<'div'>, 'layoutId'> & { layoutId: string }) {
  return (
    <motion.div
      {...props}
      layout
      layoutId={layoutId}
      className={withBaseClass('presentation-emphasis', className)}
      data-presentation-node="emphasis"
    />
  )
}
