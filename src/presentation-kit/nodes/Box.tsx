import { motion } from 'motion/react'
import type { NodeProps } from '../types'

export function Box({ layoutId, children, className, style, ...dataProps }: NodeProps) {
  return <motion.div layout layoutId={layoutId} className={className} style={style} data-presentation-layout-id={layoutId} data-presentation-node="box" {...dataProps}>{children}</motion.div>
}
