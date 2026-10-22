import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { geometryStyle, useEntityMotion } from './entity.ts'
import type { Geometry } from './entity.ts'

export interface FrameProps extends Geometry, Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'children'> {
  children?: ReactNode
  id: string
  label?: ReactNode
}

/** An outline region around other entities; it never contains or reflows them. */
export function Frame({ id, x, y, w, h, label, style, children, ...rest }: FrameProps) {
  const entity = useEntityMotion(id)
  return (
    <motion.div data-presentation-frame="" {...entity} style={geometryStyle({ x, y, w, h }, style)} {...rest}>
      {label !== undefined ? <span data-presentation-frame-label="">{label}</span> : null}
      {children}
    </motion.div>
  )
}
