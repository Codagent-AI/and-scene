import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'children'> & { children?: ReactNode; entityId: string; Icon?: LucideIcon }
export function Node({ entityId, Icon, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={entityId} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} {...props} data-presentation-entity={entityId}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
