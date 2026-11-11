import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { entityTransition } from '../constants'

export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'children'> { id: string; Icon?: LucideIcon; children?: ReactNode }
export function Box({ id, Icon, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} data-presentation-node="box" data-entity-id={id}
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0 } }}
    transition={entityTransition} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
