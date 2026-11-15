import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'children'> & { id: string; kind?: string; children?: ReactNode }
export function Node({ id, kind, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} data-presentation-node={kind} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} {...props}>{children}</motion.div>
}
