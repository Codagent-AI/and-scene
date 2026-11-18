import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'children'> & { identity: string; Icon?: LucideIcon; children?: ReactNode }
export function Node({ identity, Icon, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={identity} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
