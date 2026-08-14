import { motion } from 'motion/react'
import type { SVGMotionProps } from 'motion/react'

export function Arrow({ layoutId, className, ...props }: Omit<SVGMotionProps<SVGSVGElement>, 'layoutId'> & { layoutId: string }) {
  return <motion.svg {...props} layout layoutId={layoutId} className={`presentation-arrow${className ? ` ${className}` : ''}`} data-presentation-node="arrow" />
}
