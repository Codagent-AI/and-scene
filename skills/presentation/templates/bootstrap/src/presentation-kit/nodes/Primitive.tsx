import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode
  id: string
  Icon?: LucideIcon
  'data-presentation-allow-overlap'?: string
}
export function Primitive({ id, Icon, children, kind, ...props }: NodeProps & { kind: string }) {
  return <motion.div layout layoutId={id} data-presentation-node={kind} data-presentation-entity={id} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
