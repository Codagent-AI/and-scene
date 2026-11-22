import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T, ENTER_DELAY, ENTER_T } from '../constants'
export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'children'> { children?: ReactNode; id: string; Icon?: LucideIcon; kind?: string }
export function Node({ id, children, Icon, kind = 'box', style, ...props }: NodeProps) {
  return <motion.div {...props} data-presentation-node={kind} data-presentation-entity={id} layout layoutId={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: ENTER_T } }} transition={{ layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T, delay: ENTER_DELAY } }} style={{ position: 'absolute', ...style }}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
