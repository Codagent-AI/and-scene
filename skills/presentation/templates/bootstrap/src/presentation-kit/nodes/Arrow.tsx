import { motion } from 'motion/react'
import type { SVGMotionProps } from 'motion/react'
import { entityTransition } from './transitions'

export function Arrow(props: SVGMotionProps<SVGSVGElement>) {
  return <motion.svg data-presentation-arrow="" layout transition={entityTransition} {...props} />
}
