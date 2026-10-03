import { motion } from 'motion/react'
import type { NodeProps } from '../types'
export function Label({ id, className, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} className={className} data-presentation-label="" data-entity-id={id} {...props}>{children}</motion.div>
}
