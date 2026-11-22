import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'children'> & { children?: ReactNode; entity: string; Icon?: LucideIcon }
export function primitive(kind: string) {
  return function Node({ entity, Icon, children, ...props }: NodeProps) {
    return <motion.div layout layoutId={entity} data-presentation-node={kind} data-presentation-entity={entity} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
  }
}
