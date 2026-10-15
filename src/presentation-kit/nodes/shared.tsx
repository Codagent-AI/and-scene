import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'

export type NodeProps = Omit<HTMLMotionProps<'div'>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> & { id: string; children?: ReactNode }
export function Node({ id, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} transition={{ duration: LAYOUT_T }} data-presentation-node="" {...props}>{children}</motion.div>
}
