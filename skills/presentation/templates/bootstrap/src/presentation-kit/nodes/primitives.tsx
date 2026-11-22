import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'children'> & { id: string; Icon?: LucideIcon; children?: ReactNode }
export function Node({ id, Icon, children, kind, ...props }: NodeProps & { kind: string }) {
  return <motion.div layout layoutId={id} transition={{ layout: LAYOUT_T }} data-presentation-node={kind} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
