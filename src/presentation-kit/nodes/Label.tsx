import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_T, LAYOUT_TRANSITION } from '../constants'
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
      exit={{ opacity: 0, transition: { duration: ENTER_T * 0.6 } }}
      style={geometryStyle({ x, y, width, height }, style)}
      {...rest}
    />
  )
}
