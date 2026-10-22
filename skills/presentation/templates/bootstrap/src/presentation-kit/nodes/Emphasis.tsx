import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { geometryStyle, useEntityMotion } from './entity.ts'
import type { Geometry } from './entity.ts'

export interface EmphasisProps extends Geometry, Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId'> {
  id: string
}

/** A marker drawn over a region to call attention to it (a flag, ring, or highlight). */
export function Emphasis({ id, x, y, w, h, style, children, ...rest }: EmphasisProps) {
  const entity = useEntityMotion(id)
  return (
    <motion.div data-presentation-emphasis="" {...entity} style={geometryStyle({ x, y, w, h }, style)} {...rest}>
      {children}
    </motion.div>
  )
}
