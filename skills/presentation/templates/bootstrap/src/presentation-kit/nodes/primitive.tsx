import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'children'> & { id: string; Icon?: LucideIcon; children?: ReactNode }
export function Primitive({ id, Icon, children, style, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} data-presentation-entity={id} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} {...props} style={style}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
