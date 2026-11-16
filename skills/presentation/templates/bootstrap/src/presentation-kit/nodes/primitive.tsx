import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'children'> { entityId: string; Icon?: LucideIcon; children?: ReactNode }
export function primitive(kind: string) {
  return function Node({ entityId, Icon, children, ...props }: NodeProps) {
    return <motion.div layout layoutId={entityId} data-presentation-node={kind} data-presentation-entity={entityId}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T, delay: ENTER_DELAY } }}
      {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
  }
}
