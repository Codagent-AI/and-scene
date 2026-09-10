import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'

interface SceneLayerProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  allowOverlap?: boolean
}

export function SceneLayer({ children, className, style, allowOverlap }: SceneLayerProps) {
  return <motion.div className={`presentation-scene-layer${className ? ` ${className}` : ''}`} data-presentation-scene-layer data-presentation-allow-overlap={allowOverlap || undefined} style={{ position: 'absolute', inset: 0, ...style }}>{children}</motion.div>
}
