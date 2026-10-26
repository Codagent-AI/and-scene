import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_T, LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'children'> & { id: string; Icon?: LucideIcon; children?: ReactNode }
export function Box({ id, Icon, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} data-presentation-node="box" data-entity-id={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ layout: LAYOUT_T, opacity: ENTER_T }} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
