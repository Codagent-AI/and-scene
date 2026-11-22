import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
export type NodeProps = Omit<HTMLMotionProps<'div'>, 'id' | 'children'> & { id: string; Icon?: LucideIcon; children?: ReactNode }
export function Primitive({ id, Icon, children, kind, ...props }: NodeProps & { kind: string }) {
  return <motion.div {...props} layout layoutId={id} data-presentation-node={kind} data-presentation-entity={id} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}>
    {Icon && <Icon aria-hidden="true" />}{children}
  </motion.div>
}
