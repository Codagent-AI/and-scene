import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { withBaseClass } from './classNames'

export function SceneLayer({ className, style, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      {...props}
      className={withBaseClass('presentation-scene-layer', className)}
      data-presentation-scene-layer
      style={{ position: 'absolute', inset: 0, ...style }}
    />
  )
}
