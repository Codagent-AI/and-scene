import { motion } from 'motion/react'
import type { NodeProps } from '../types'

export function SceneLayer({ children, layoutId, className, style, ...dataProps }: NodeProps) {
  return <motion.div layout layoutId={layoutId} className={className} style={{ position: 'absolute', inset: 0, ...style }} data-presentation-node="scene-layer" data-presentation-layout-id={layoutId} {...dataProps}>{children}</motion.div>
}
