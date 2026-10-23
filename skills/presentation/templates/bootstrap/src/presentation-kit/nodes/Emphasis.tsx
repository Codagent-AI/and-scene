import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { placeStyle, type Rect } from './geometry'

export interface EmphasisProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId'> {
  entity: string
  at?: Rect
}

/** Marker drawn over another entity to flag it; styling is the presentation's. */
export function Emphasis({ entity, at, style, ...rest }: EmphasisProps) {
  return (
    <motion.div
      layout
      layoutId={entity}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-emphasis=""
      data-presentation-entity={entity}
      aria-hidden="true"
      {...rest}
      style={{ pointerEvents: 'none', ...placeStyle(at, style) }}
    />
  )
}
