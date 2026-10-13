import { motion } from 'motion/react'
import type { NodeProps } from '../types'

export function Arrow({ layoutId, children, className, style, ...dataProps }: NodeProps) {
  return <motion.div layout layoutId={layoutId} className={className} style={style} aria-hidden="true" data-presentation-layout-id={layoutId} data-presentation-node="arrow" {...dataProps}>{children}</motion.div>
}
