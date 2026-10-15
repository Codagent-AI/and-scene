import { motion } from 'motion/react'
import type { SVGMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'
export type ArrowProps = Omit<SVGMotionProps<SVGSVGElement>, 'children' | 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> & { id: string }
export function Arrow({ id, ...props }: ArrowProps) {
  return <motion.svg viewBox="0 0 100 24" layout layoutId={id} transition={{ duration: LAYOUT_T }} data-presentation-node="" role="img" aria-label="Arrow" {...props}><path d="M2 12h92m-12-9 12 9-12 9" fill="none" stroke="currentColor" /></motion.svg>
}
