import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

export function SceneLayer({ style, ...props }: HTMLMotionProps<'div'> & { [attribute: `data-${string}`]: unknown }) {
  return <motion.div {...props} data-presentation-node="scene-layer" style={{ position: 'absolute', inset: 0, ...style }} />
}
