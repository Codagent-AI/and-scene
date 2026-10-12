import { motion } from 'motion/react'
import type { NodeProps } from './Box'
export function Frame({ id, children, className, style, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} className={className} style={style} data-presentation-node={id} {...props}>{children}</motion.div>
}
