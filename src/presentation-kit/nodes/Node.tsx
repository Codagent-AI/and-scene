import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_T } from '../constants'
export interface NodeProps extends HTMLMotionProps<'div'> {
  children?: ReactNode
  id: string
  Icon?: LucideIcon
}
export function Node({ id, Icon, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} data-presentation-entity={id} transition={{ layout: LAYOUT_T }} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
