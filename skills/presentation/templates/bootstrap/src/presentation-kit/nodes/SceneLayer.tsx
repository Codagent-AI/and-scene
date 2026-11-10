import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
export function SceneLayer({ style, ...props }: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-layer="" style={{ position: 'absolute', inset: 0, ...style }} {...props} />
}
