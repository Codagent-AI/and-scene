import { motion, type HTMLMotionProps } from 'motion/react'
import { entityProps, placeStyle, type Rect } from './geometry'

export interface FrameProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId'> {
  entity: string
  at?: Rect
}

/** A positioned region. Its look (border, dash, fill) belongs to the presentation. */
export function Frame({ entity, at, style, ...rest }: FrameProps) {
  return (
    <motion.div
      {...entityProps(entity, 'frame')}
      {...rest}
      style={placeStyle(at, style)}
    />
  )
}
