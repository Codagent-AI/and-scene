import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'children'> { children?: ReactNode; id: string; Icon?: LucideIcon }
export function Node({ id, Icon, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} data-presentation-entity={id} transition={{ layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T } }} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
export const entrance = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T } }, exit: { opacity: 0, transition: { delay: 0, duration: ENTER_T } } }
