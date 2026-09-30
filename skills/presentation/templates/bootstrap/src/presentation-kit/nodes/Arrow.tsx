import { motion } from 'motion/react'
import type { SVGMotionProps } from 'motion/react'
import { withBaseClass } from './classNames'

export function Arrow({ layoutId, className, ...props }: Omit<SVGMotionProps<SVGSVGElement>, 'layoutId'> & { layoutId: string }) {
  return (
    <motion.svg
      {...props}
      layout
      layoutId={layoutId}
      className={withBaseClass('presentation-arrow', className)}
      data-presentation-node="arrow"
    />
  )
}
