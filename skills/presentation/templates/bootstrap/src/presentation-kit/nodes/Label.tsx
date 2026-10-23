import { motion, type HTMLMotionProps } from 'motion/react'
import { entityProps, placeStyle, type Rect } from './geometry'

export interface LabelProps extends Omit<HTMLMotionProps<'span'>, 'id' | 'layoutId'> {
  entity: string
  at?: Rect
}

export function Label({ entity, at, style, ...rest }: LabelProps) {
  return (
    <motion.span
      {...entityProps(entity, 'label')}
      {...rest}
      style={placeStyle(at, style)}
    />
  )
}
