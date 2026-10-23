import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { placeStyle, type Rect } from './geometry'

export interface FrameProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId'> {
  entity: string
  at?: Rect
}

/** A positioned region. Its look (border, dash, fill) belongs to the presentation. */
export function Frame({ entity, at, style, ...rest }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={entity}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-frame=""
      data-presentation-entity={entity}
      {...rest}
      style={placeStyle(at, style)}
    />
  )
}
