import { motion } from 'motion/react'
import type { NodeProps } from '../types'
export function Emphasis({ id, className, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} className={className} data-presentation-emphasis="" data-entity-id={id} {...props}>{children}</motion.div>
}
