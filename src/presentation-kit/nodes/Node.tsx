import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_T, LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'children'> & { children?: ReactNode; id: string; Icon?: LucideIcon }
export function Node({ id, Icon, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} data-presentation-entity={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ layout: LAYOUT_T, opacity: ENTER_T }} {...props}>
    {Icon && <Icon aria-hidden="true" />}{children}
  </motion.div>
}
