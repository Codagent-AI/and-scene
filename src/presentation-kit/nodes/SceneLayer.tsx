import { motion, type HTMLMotionProps } from 'motion/react'

export function SceneLayer({ style, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      data-presentation-scene-layer="true"
      style={{ position: 'absolute', inset: 0, ...style }}
      {...props}
    />
  )
}
