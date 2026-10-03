import { motion } from 'motion/react'
import type { NodeProps } from '../types'
export function Arrow({ id, className, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} className={className} data-presentation-arrow="" data-entity-id={id} aria-hidden="true" {...props}>{children}</motion.div>
}
