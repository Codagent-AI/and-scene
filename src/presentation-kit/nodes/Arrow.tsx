import { motion } from 'motion/react'
import type { SVGMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'
export function Arrow({ id, ...props }: SVGMotionProps<SVGSVGElement> & { id: string }) {
  return <motion.svg layout layoutId={id} transition={LAYOUT_T} data-presentation-node="arrow" viewBox="0 0 100 20" {...props}><path d="M0 10 H96 M88 2 L96 10 L88 18" fill="none" stroke="currentColor" /></motion.svg>
}
