import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, ENTER_T, LAYOUT_T } from '../constants'

export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'children'> {
  id: string
  children?: ReactNode
  Icon?: LucideIcon
}
export function Primitive({ id, Icon, children, kind, ...props }: NodeProps & { kind: string }) {
  return <motion.div layout layoutId={id} data-presentation-node={kind} data-presentation-entity={id} initial={false} exit={{ opacity: 0, transition: { duration: ENTER_T } }} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} {...props}>
    {Icon && <Icon aria-hidden="true" />}{children}
  </motion.div>
}
