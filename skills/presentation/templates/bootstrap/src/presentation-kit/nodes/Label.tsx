import { motion } from 'motion/react'
import type { NodeProps } from '../types'

export function Label({ layoutId, children, className, style, ...dataProps }: NodeProps) {
  return <motion.span layout layoutId={layoutId} className={className} style={style} data-presentation-layout-id={layoutId} data-presentation-node="label" {...dataProps}>{children}</motion.span>
}
