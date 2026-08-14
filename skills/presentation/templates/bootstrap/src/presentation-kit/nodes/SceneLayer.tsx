import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

export function SceneLayer({ className, style, ...props }: HTMLMotionProps<'div'>) {
  return <motion.div {...props} className={`presentation-scene-layer${className ? ` ${className}` : ''}`} data-presentation-scene-layer style={{ position: 'absolute', inset: 0, ...style }} />
}
