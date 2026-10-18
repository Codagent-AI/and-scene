import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export type LabelProps = Omit<HTMLMotionProps<'span'>, 'ref'> & Geometry & { layoutId?: string }

export function Label({ layoutId, x, y, width, height, style, ...rest }: LabelProps) {
  return (
    <motion.span
      data-presentation-node="label"
      data-presentation-id={layoutId}
      layout="position"
      layoutId={layoutId}
      transition={LAYOUT_TRANSITION}
      style={geometryStyle({ x, y, width, height }, style)}
      {...rest}
    />
  )
}
