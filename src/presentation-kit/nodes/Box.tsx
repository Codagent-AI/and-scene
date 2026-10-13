import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
export function Box({ id, className = '', children, ...props }: HTMLMotionProps<'div'> & { id: string; children: ReactNode }) {
  return <motion.div layout layoutId={id} data-presentation-entity={id} className={className} {...props}>{children}</motion.div>
}
