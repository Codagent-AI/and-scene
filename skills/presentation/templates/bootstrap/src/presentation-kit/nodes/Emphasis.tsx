import { motion, type HTMLMotionProps } from 'motion/react'
import { entityProps, placeStyle, type Rect } from './geometry'

export interface EmphasisProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId'> {
  entity: string
  at?: Rect
}

/** Marker drawn over another entity to flag it; styling is the presentation's. */
export function Emphasis({ entity, at, style, ...rest }: EmphasisProps) {
  return (
    <motion.div
      {...entityProps(entity, 'emphasis')}
      aria-hidden="true"
      {...rest}
      style={{ pointerEvents: 'none', ...placeStyle(at, style) }}
    />
  )
}
