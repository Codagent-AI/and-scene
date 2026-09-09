import { motion, type HTMLMotionProps } from 'motion/react'

export function SceneLayer({ className, style, ...props }: HTMLMotionProps<'div'>) {
  return <motion.div {...props} className={['presentation-scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer style={{ position: 'absolute', ...style }} />
}
