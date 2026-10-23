import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { placeStyle, type Rect } from './geometry'

export interface LabelProps extends Omit<HTMLMotionProps<'span'>, 'id' | 'layoutId'> {
  entity: string
  at?: Rect
}

export function Label({ entity, at, style, ...rest }: LabelProps) {
  return (
    <motion.span
      layout
      layoutId={entity}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-label=""
      data-presentation-entity={entity}
      {...rest}
      style={placeStyle(at, style)}
    />
  )
}
