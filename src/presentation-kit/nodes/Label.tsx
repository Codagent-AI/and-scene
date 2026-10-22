import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { geometryStyle, useEntityMotion } from './entity.ts'
import type { Geometry } from './entity.ts'

export interface LabelProps extends Geometry, Omit<HTMLMotionProps<'span'>, 'id' | 'layoutId'> {
  id: string
}

export function Label({ id, x, y, w, h, style, children, ...rest }: LabelProps) {
  const entity = useEntityMotion(id)
  return (
    <motion.span data-presentation-label="" {...entity} style={geometryStyle({ x, y, w, h }, style)} {...rest}>
      {children}
    </motion.span>
  )
}
