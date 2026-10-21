import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { FILL_STYLE } from './geometry'

/**
 * Absolutely positions one step's diagram over the whole canvas so mounting or
 * unmounting a layer never reflows another.
 */
export function SceneLayer({ style, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      data-presentation-layer
      style={{ ...FILL_STYLE, ...style }}
      {...rest}
    />
  )
}
