import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'id' | 'children'> & { id: string; Icon?: LucideIcon; children?: ReactNode }
export function Box({ id, Icon, children, style, ...props }: NodeProps) {
  return <motion.div data-presentation-node="box" {...props} data-presentation-entity={id} layoutId={id} layout initial={false} exit={{ opacity: 0 }} transition={LAYOUT_T} style={{ position: 'absolute', ...style }}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
