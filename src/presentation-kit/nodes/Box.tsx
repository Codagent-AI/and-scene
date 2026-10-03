import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
type Props = Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> & { id: string; Icon?: LucideIcon; children?: ReactNode }
export function Box({ id, Icon, children, className, ...props }: Props) {
  return <motion.div layout layoutId={id} className={['presentation-box', className].filter(Boolean).join(' ')} data-presentation-node="box" data-entity-id={id} {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
