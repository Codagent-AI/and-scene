import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'children'> { children?: ReactNode; entityId: string; Icon?: LucideIcon }
export function Primitive({ entityId, Icon, children, kind, ...props }: NodeProps & { kind: string }) {
  return <motion.div layout layoutId={entityId} data-presentation-node={kind} data-presentation-entity={entityId} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
