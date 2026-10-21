import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

/**
 * Absolutely positions one step's diagram over the whole canvas so mounting or
 * unmounting a layer never reflows another.
 */
export function SceneLayer({ style, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      data-presentation-layer
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', ...style }}
      {...rest}
    />
  )
}
