import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_T } from '../constants'
export type BoxProps = Omit<HTMLMotionProps<'div'>, 'children'> & { id: string; Icon?: LucideIcon; children?: ReactNode }
export function Box({ id, Icon, children, ...props }: BoxProps) {
  return <motion.div layout layoutId={id} transition={{ layout: LAYOUT_T }} data-presentation-node="box" data-entity-id={id} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
